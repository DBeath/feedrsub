var express = require('express');
var feedrsub = require('./feedrsub.js');
var mongo = require('./db/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
var ObjectID = require('mongodb').ObjectID;
var pubSubHubbub = require('pubsubhubbub');

var app = module.exports = express();

var pubsub = pubSubHubbub.createServer({
  callbackUrl: config.pubsub.callbackurl,
  secret: config.pubsub.secret,
  username: config.pubsub.username,
  password: config.pubsub.password,
  format: config.pubsub.format
});

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

app.get('/subscription/:id', function (req, res) {
  mongo.subscriptions.findOne({_id: ObjectID.createFromHexString(req.params.id)}, function (err, doc) {
    mongo.feeds.find({topic: doc.topic}).limit(10).toArray(function (err, docs) {
      res.render('feeds', {title: 'Feeds for '+doc.topic, feeds: docs});
    });
  });
});

app.get('/newsub', function (req, res) {
  res.render('new_subscription', {title: 'Subscribe'});
});

app.post('/newsub', function (req, res) {
  mongo.subscriptions.insert({topic: req.param('topic')}, function (err, docs) {
    res.redirect('/');
  });
});

feedrsub.pubsubinit(function () {
  console.log('Feedrsub initiated');
  app.listen(4000);
});

