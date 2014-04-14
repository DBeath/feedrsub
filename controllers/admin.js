var mongo = require('../models/mongodb.js');
var config = require('../config.json');
var validator = require('validator');
var async = require('async');


module.exports.AdminController = function (pubsub) {
  return new admin(pubsub);
};

function admin (pubsubobj) {
  pubsub = pubsubobj;
};

admin.prototype.index = function (req, res) {
  // mongo.feeds.listAll(function (err, docs) {
  //   if (err) console.log(err);
  //   res.render('feed_list', {
  //     title: 'Feeds', 
  //     feeds: docs
  //   });
  // });
  var feedCount, subscribedCount, unsubscribedCount;

  async.parallel([
    function (callback) {
      mongo.feeds.collection.count(function (err, result, callback) {
        if (err) console.log(err);
        feedCount = result;
        callback(null, result);
      });
    },
    function (callback) {
      mongo.feeds.collection.count({status: 'subscribed'}, function (err, result, callback) {
        if (err) console.log(err);
        subscribedCount = result;
        callback(null, result);
      });
    },
    function (callback) {
      mongo.feeds.collection.count({status: 'unsubscribed'}, function (err, result, callback) {
        if (err) console.log(err);
        unsubscribedCount = result;
        callback(null, result);
      });
    }
  ], function () {
    res.render('admin_page', {
      title: 'Admin',
      feedCount: feedCount,
      subscribedCount: subscribedCount,
      unsubscribedCount: unsubscribedCount
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
    if ( validator.isURL(subs[i]) ) {
      mongo.feeds.updateStatus(subs[i], 'pending', function (err, doc) {
        if (err) {
          console.log(err);
          req.flash('err', 'Database update failed');
          return res.redirect('/subscribed');
        };
        console.log('Subscribing to %s', doc.topic);
        pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
          if (err) console.log(err);
          else console.log(result);
        });
      });
    } else {
      console.log('%s is not a valid URL', subs[i]);
    };
  };
  res.redirect('/subscribed');
};

admin.prototype.resubscribe = function (req, res) {
  mongo.feeds.updateStatusById(req.params.id, 'pending', function (err, doc) {
    if (err) {
      console.log(err);
      req.flash('error', 'Database update failed');
      return res.redirect('/subscribed');
    }
    console.log('Resubscribing to %s', doc.topic);
    pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err);
        return res.redirect('/subscribed');
      };
      req.flash('info', 'Subscription successful');
      res.redirect('/subscribed');
    });
  });
};

admin.prototype.unsubscribe = function (req, res) {
  mongo.feeds.updateStatusById(req.params.id, 'pending', function (err, doc) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      return res.redirect('/unsubscribed');
    };
    console.log('Unsubscribing from %s', doc.topic);
    pubsub.unsubscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) {
        console.log(err);
        req.flash('error', err);
        return res.redirect('/unsubscribed');
      };
      var message = 'Unsubscribed from ' + doc.topic;
      req.flash('info', message);
      res.redirect('/unsubscribed');
    });
  });
};

admin.prototype.unsubscribed_feeds = function (req, res) {
  mongo.feeds.listByStatus('unsubscribed', function (err, docs) {
    if (err) console.log(err);
    res.render('unsubscribed_feed_list', {
      title: 'Unsubscribed Feeds',
      feeds: docs,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};

admin.prototype.subscribed_feeds = function (req, res) {
  mongo.feeds.listByStatus('subscribed', function (err, docs) {
    if (err) console.log(err);
    res.render('subscribed_feed_list', {
      title: 'Subscribed Feeds',
      feeds: docs,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};

admin.prototype.pending_feeds = function (req, res) {
  mongo.feeds.listByStatus('pending', function (err, docs) {
    if (err) console.log(err);
    res.render('pending_feed_list', {
      title: 'Feeds pending subscription/unsubscription',
      feeds: docs
    });
  });
};