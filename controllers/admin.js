var mongo = require('../models/mongodb.js');
var config = require('../config.json');

var pubsub = 'this should be a pubsub object';

module.exports.adminController = function (pubsub) {
  return new admin(pubsub);
};

function admin (pubsubobj) {
  pubsub = pubsubobj;
};

admin.prototype.index = function (req, res) {
  mongo.feeds.listAll(function (err, docs) {
    if (err) console.log(err);
    res.render('feed_list', {
      title: 'Feeds', 
      feeds: docs
    });
  });
};

admin.prototype.feed = function (req, res) {
  mongo.feeds.findOneById(req.params.id, function (err, doc) {
    if (err) console.log(err);
    mongo.entries.list(doc.topic, 100, function (err, docs) {
      if (err) console.log(err);
      res.render('feed', {
        title: 'Entries for ' + doc.topic, 
        entries: docs
      });
    });
  });
};

admin.prototype.deletefeed = function (req, res) {
  mongo.feeds.delete(req.params.id, function (err, num) {
    if (err) console.log(err);
    console.log('Deleted %s', req.params.id);
    res.redirect('/admin');
  });
};

admin.prototype.newfeed = function (req, res) {
  res.render('subscribe', {title: 'Subscribe'});
};

admin.prototype.subscribe = function (req, res) {
  var subs = req.param('topic').split(/[\s,]+/);
  for (var i = 0; i < subs.length; i++) {
    mongo.feeds.subscribe(subs[i], function (err, topic) {
      if (err) console.log(err);
      pubsub.subscribe(topic, config.pubsub.hub);
    });
    console.log('Subscribing to %s', subs[i]);
    
  };
  res.redirect('/admin');
};

admin.prototype.resubscribe = function (req, res) {
  mongo.feeds.findOneById(req.params.id, function (err, doc) {
    if (err) console.log(err);
    console.log('Resubscribing to %s', doc.topic);
    pubsub.subscribe(doc.topic , config.pubsub.hub);
  });
};

admin.prototype.unsubscribe = function (req, res) {
  console.log(pubsub);
  mongo.feeds.findOneById(req.params.id, function (err, doc) {
    if (err) console.log(err);
    console.log('Unsubscribing from '+doc.topic);
    pubsub.unsubscribe(doc.topic, config.pubsub.hub);
  });
  res.redirect('/unsubscribed');
};

admin.prototype.unsubscribed_feeds = function (req, res) {
  mongo.feeds.listByStatus('unsubscribed', function (err, docs) {
    if (err) console.log(err);
    res.render('unsubscribed_feed_list', {
      title: 'Unsubscribed Feeds',
      feeds: docs
    });
  });
};

admin.prototype.subscribed_feeds = function (req, res) {
  mongo.feeds.listByStatus('subscribed', function (err, docs) {
    if (err) console.log(err);
    res.render('subscribed_feed_list', {
      title: 'Subscribed Feeds',
      feeds: docs
    });
  });
};