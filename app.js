const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
app.use(bodyParser.json());
const path = require('path');
const Arena = require('are.na');
let arena = new Arena();

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/api/sites', function(req, res){
  arena.channel('scoby').get()
  .then(chan => {
      res.send(chan);
  })
  .catch(err => console.log(err));
})

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
})

app.get('/:page', (req, res) => {
  res.sendFile(__dirname + '/public/page.html');
})

app.use(express.static(__dirname + '/public', {
    extensions: ['html', 'htm'],
}));

app.listen(process.env.PORT || 3001, process.env.IP || '0.0.0.0', ()=>{
  console.log('app listening on port 3001')
});