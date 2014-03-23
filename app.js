var express = require('express');
var feedrsub = require('./feedrsub.js');
var mongo = require('./db/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
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

app.get('/', function (req, res) {
  // mongo.subscriptions.find().toArray(function (err, docs) {
  //   res.render('subscription_list', {title: 'Subscriptions', subscriptions:docs});
  // });
  mongo.subscriptions.listAll(function (err, docs) {
    res.render('subscription_list', {title: 'Subscriptions', subscriptions:docs});
  });
});

app.get('/subscription/:id', function (req, res) {
  mongo.subscriptions.findOne({_id: ObjectID.createFromHexString(req.params.id)}, function (err, doc) {
    mongo.feeds.find({topic: doc.topic}).limit(10).toArray(function (err, docs) {
      res.render('subscription', {title: 'Feeds for '+doc.topic, feeds: docs});
    });
  });
});

app.del('/subscription/:id', function (req, res) {
  console.log('Deleting %s', req.params.id);
  // mongo.subscriptions.remove({_id: ObjectID.createFromHexString(req.params.id)}, true, function (err, doc) {
  //   res.redirect('/');
  // });
  mongo.subscriptions.delete(req.params.id, function (err, num) {
    if (err) console.log(err);
    res.redirect('/');
  });
});

// app.get('/newsub', function (req, res) {
//   res.render('new_subscription', {title: 'Subscribe'});
// });

// app.post('/newsub', function (req, res) {
//   mongo.subscriptions.insert({topic: req.param('topic')}, function (err, docs) {
//     res.redirect('/');
//   });
// });

feedrsub.pubsubinit(function () {
  console.log('Feedrsub initiated');
  app.listen(config.express.port);
  console.log('App listening on port %s', config.express.port);
});

