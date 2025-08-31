const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
app.use(bodyParser.json());
const path = require('path');
const Arena = require('are.na');
let arena = new Arena();

// Simple in-memory cache for aggregated channel contents
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let allChannelsCache = {
  data: null,
  cachedAt: 0
};

app.use(bodyParser.urlencoded({ extended: false }));

// We'll keep this endpoint for backward compatibility
app.get('/api/sites', async function(req, res) {
  const page = req.query.page || 1;
  const per = Math.min(parseInt(req.query.per || 50, 10), 50);
  
  try {
    const response = await fetch(`https://api.are.na/v2/channels/scoby/contents?per=${per}&page=${page}&direction=desc&sort=position`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Scoby/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      res.status(response.status).send({
        error: 'API request failed',
        status: response.status,
        message: errorText
      });
      return;
    }

    const data = await response.json();
    console.log('API Response for /api/sites:', JSON.stringify(data).slice(0, 200));
    
    // Handle different response formats
    let contents = [];
    if (data.contents) {
      contents = data.contents;
    } else if (Array.isArray(data)) {
      contents = data;
    }
    
    // Add pagination info to the response
    const responseData = {
      contents: contents,
      current_page: parseInt(page),
      per_page: per,
      has_more: contents.length === parseInt(per)
    };
    
    res.send(responseData);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).send({
      error: 'Internal server error',
      message: err.message
    });
  }
});

// Aggregated endpoint: returns ALL channels in the `scoby` channel, cached
app.get('/api/sites/all', async function(req, res) {
  const per = 50; // Are.na cap
  const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
  const now = Date.now();

  // Serve from cache unless refresh requested or cache expired
  if (!refresh && allChannelsCache.data && (now - allChannelsCache.cachedAt < CACHE_TTL_MS)) {
    res.send({
      contents: allChannelsCache.data,
      total: allChannelsCache.data.length,
      cached_at: new Date(allChannelsCache.cachedAt).toISOString(),
      cache_ttl_ms: CACHE_TTL_MS,
      from_cache: true
    });
    return;
  }

  try {
    // Get channel to determine total length
    const channelResponse = await fetch('https://api.are.na/v2/channels/scoby', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Scoby/1.0',
        'Cache-Control': 'no-cache'
      }
    });

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      res.status(channelResponse.status).send({
        error: 'Failed to fetch channel info',
        status: channelResponse.status,
        message: errorText
      });
      return;
    }

    const channelData = await channelResponse.json();
    const totalBlocks = channelData.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalBlocks / per));

    // Fetch all pages in parallel
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    const requests = pageNumbers.map(pageNum =>
      fetch(`https://api.are.na/v2/channels/scoby/contents?page=${pageNum}&per=${per}&direction=desc&sort=position`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Scoby/1.0',
          'Cache-Control': 'no-cache'
        }
      }).then(r => {
        if (!r.ok) throw new Error(`Contents request failed: ${r.status}`);
        return r.json();
      })
    );

    const pages = await Promise.all(requests);

    // Merge, filter to Channels, and dedupe by id
    const seenIds = new Set();
    const merged = [];
    pages.forEach(data => {
      if (data && data.contents && data.contents.length) {
        data.contents.forEach(item => {
          if (item.class === 'Channel' && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            merged.push(item);
          }
        });
      }
    });

    // Update cache
    allChannelsCache.data = merged;
    allChannelsCache.cachedAt = now;

    res.send({
      contents: merged,
      total: merged.length,
      cached_at: new Date(allChannelsCache.cachedAt).toISOString(),
      cache_ttl_ms: CACHE_TTL_MS,
      from_cache: false
    });
  } catch (err) {
    console.error('Error aggregating channels:', err);
    res.status(500).send({
      error: 'Internal server error',
      message: err.message
    });
  }
});

app.get('/api/:site', function(req, res){
    // add search params for page, eg /api/scoby?page=2
    // ------------------------------------------------
    // its an art to find the perfect balance between
    // amount of blocks to return per request and the
    // actual amount of requests needed to load content
    arena.channel(req.params.site).contents({ page: req.query.page ? req.query.page : 1, 
      per: req.query.per ? req.query.per : 24,
      direction: 'desc',
      sort: 'position'
     })
      .then(contents => {
        // console.log(contents)
        res.send(contents);
        // res.sendFile(__dirname + '/public/index.html');
      })
      .catch(err => console.log(err));
  })

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/:page', (req, res) => {
  res.sendFile(__dirname + '/public/page.html');
});

app.use(express.static(__dirname + '/public', {
  extensions: ['html', 'htm'],
}));

app.listen(process.env.PORT || 3001, process.env.IP || '0.0.0.0', () => {
  console.log('app listening on port 3001');
});