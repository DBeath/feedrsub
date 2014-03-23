var express = require('express');
var feedrsub = require('./feedrsub.js');
var mongo = require('./db/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;

var app = module.exports = express();

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler());
  app.use(express.basicAuth(config.express.admin, config.express.adminpass));
});

hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY')
});

app.get('/', function (req, res) {
  mongo.subscriptions.listAll(function (err, docs) {
    res.render('subscription_list', {title: 'Subscriptions', subscriptions:docs});
  });
});

app.get('/subscription/:id', function (req, res) {
  mongo.subscriptions.findOneById({_id: ObjectID.createFromHexString(req.params.id)}, function (err, doc) {
    mongo.feeds.find({topic: doc.topic}).limit(10).toArray(function (err, docs) {
      res.render('subscription', {title: 'Feeds for '+doc.topic, feeds: docs});
    });
  });

  mongo.subscriptions.findOne(req.params.id, function (err, doc) {
    if (err) console.log(err);
    mongo.feeds.list(doc.topic, 100, function (err, docs) {
      if (err) console.log(err);
      res.render('subscription', {title: 'Feeds for ' + doc.topic, feeds: docs})
    });
  });
});

app.del('/subscription/:id', function (req, res) {
  mongo.subscriptions.delete(req.params.id, function (err, num) {
    if (err) console.log(err);
    console.log('Deleted %s', req.params.id);
    res.redirect('/');
  });
});

app.get('/subscribe', function (req, res) {
  res.render('new_subscription', {title: 'Subscribe'});
});

app.post('/subscribe', function (req, res) {
  mongo.subscriptions.subscribe(req.param('topic'), function (err, result) {
    if (err) console.log(err);
    console.log('Subscribed to %s', req.param('topic'));
    res.redirect('/');
  })
});

feedrsub.pubsubinit(function () {
  console.log('Feedrsub initiated');
  app.listen(config.express.port);
  console.log('App listening on port %s', config.express.port);
});

