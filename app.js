var express = require('express');
var feedrsub = require('./feedrsub.js');
var mongo = require('./db/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');

var app = module.exports = express();

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler());
});

app.get('/', function (req, res) {
  mongo.subscriptions.find().toArray(function (err, docs) {
    res.render('subscriptions', {title: 'Subscriptions', subscriptions:docs});
  });
});

feedrsub.pubsubinit(function () {
  console.log('Feedrsub initiated');
  app.listen(4000);
});

