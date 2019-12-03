require('dotenv').config({path:'.env'});
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
app.use(bodyParser.json());
const path = require('path');
const Arena = require('are.na');
const { check, validationResult } = require('express-validator');
let arena = new Arena({ accessToken: process.env.ARENA_API_KEY });

const db = require("./db");

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/getid/:channel', function(req, res){
  arena.channel(req.params.channel).get()
  .then(chan => {
      // console.log(chan);
      res.send({"id" : chan.id});
  })
  .catch(err => console.log(err));
})

app.get('/sites', function(req, res){
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

db.connect((err)=>{
  if(err){
      console.log('unable to connect to database');
      process.exit(1);
  }
  else{
      app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0', ()=>{
          console.log('connected to database, app listening on port 3000')
      });
  }
})