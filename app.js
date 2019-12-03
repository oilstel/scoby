require('dotenv').config({path:'.env'});
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
app.use(bodyParser.json());
const path = require('path');
const Arena = require('are.na');
let arena = new Arena({ accessToken: process.env.ARENA_API_KEY });

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/api/sites', function(req, res){
  arena.channel('scoby').get()
  .then(chan => {
      res.send(chan);
  })
  .catch(err => console.log(err));
})

app.get('/api/:site', function(req, res){
  arena.channel(req.params.site).contents({ page: 1, per: 100 })
    .then(contents => {
      // console.log(contents)
      res.send(contents.reverse());
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
  console.log('connected to database, app listening on port 3000')
});