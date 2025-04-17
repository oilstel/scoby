const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
app.use(bodyParser.json());
const path = require('path');

app.use(bodyParser.urlencoded({ extended: false }));

// We'll keep this endpoint for backward compatibility
app.get('/api/sites', async function(req, res) {
  const page = req.query.page || 1;
  const per = req.query.per || 64;
  
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

app.get('/api/:site', async function(req, res) {
    console.log(req.params.site);
    const response = await fetch(`https://api.are.na/v2/channels/${req.params.site}/contents?per=24&page=1&direction=desc&sort=position`, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache'
        }
    });

    const data = await response.json();
    res.send(data);
});

// app.get('/api/:site', async function(req, res) {
    
//   const page = req.query.page || 1;
//   const per = req.query.per || 24;
  
//   try {
//     const response = await fetch(`https://api.are.na/v2/channels/${req.params.site}/contents?per=${per}&page=${page}&direction=desc&sort=position`, {
//       method: 'GET',
//       headers: {
//         'Cache-Control': 'no-cache'
//       }
//     });
    
//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('API Error:', {
//         status: response.status,
//         statusText: response.statusText,
//         headers: Object.fromEntries(response.headers.entries()),
//         body: errorText
//       });
//       res.status(response.status).send({
//         error: 'API request failed',
//         status: response.status,
//         message: errorText
//       });
//       return;
//     }

//     const data = await response.json();
//     console.log('API Response for /api/:site:', JSON.stringify(data).slice(0, 200));
    
//     // Handle different response formats
//     let contents = [];
//     if (data.contents) {
//       contents = data.contents;
//     } else if (Array.isArray(data)) {
//       contents = data;
//     }
    
//     // Add pagination info to the response
//     const responseData = {
//       contents: contents,
//       current_page: parseInt(page),
//       per_page: per,
//       has_more: contents.length === parseInt(per)
//     };
    
//     res.send(responseData);
//   } catch (err) {
//     console.error('Fetch Error:', err);
//     res.status(500).send({
//       error: 'Internal server error',
//       message: err.message
//     });
//   }
// });

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