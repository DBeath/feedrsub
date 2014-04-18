var db = require('../models/mongodb.js');
var config = require('../config.json');
var validator = require('validator');
var async = require('async');
var moment = require('moment');


module.exports.AdminController = function (pubsub) {
  return new admin(pubsub);
};

function admin (pubsubobj) {
  pubsub = pubsubobj;
};

admin.prototype.index = function (req, res) {
  var dayAgo = moment().subtract('d', 1).unix();
  var weekAgo = moment().subtract('d', 7).unix();
  async.parallel({
    feedCount: function (callback) {
      db.feeds.countAll(function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    subscribedCount: function (callback) {
      db.feeds.countByStatus('subscribed', function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    unsubscribedCount: function (callback) {
      db.feeds.countByStatus('unsubscribed', function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    pendingCount: function (callback) {
      db.feeds.countByStatus('pending', function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    entriesCount: function (callback) {
      db.entries.countAll(function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    entriesInLastDay: function (callback) {
      db.entries.countRecent(dayAgo, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    entriesInLastWeek: function (callback) {
      db.entries.countRecent(weekAgo, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    feedsAddedInLastWeek: function (callback) {
      db.feeds.countRecent(weekAgo, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    }
  }, function (err, results) {
    if (err) {
      console.error(err);
      req.flash('error', err);
      return next(err);
    };
    return res.render('admin_page', {
      title: 'Admin',
      results: results,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};

admin.prototype.feed = function (req, res) {
  db.feeds.findOneById(req.params.id, function (err, doc) {
    if (err) {
      console.error(err);
      req.flash('error', err);
      return res.redirect('/admin');
    };
    var dayAgo = moment().subtract('d', 1).unix();
    var weekAgo = moment().subtract('d', 7).unix();
    async.parallel({
      entries: function (callback) {
        db.entries.list(doc.topic, 100, function (err, docs) {
          if (err) return callback(err);
          return callback(null, docs);
        });
      },
      entriesCount: function (callback) {
        db.entries.countAllByTopic(doc.topic, function (err, result) {
          if (err) return callback(err);
          return callback(null, result);
        });
      },
      entriesInLastDay: function (callback) {
        db.entries.countRecentByTopic(doc.topic, dayAgo, function (err, result) {
          if (err) return callback(err);
          return callback(null, result);
        });
      },
      entriesInLastWeek: function (callback) {
        db.entries.countRecentByTopic(doc.topic, weekAgo, function (err, result) {
          if (err) return callback(err);
          return callback(null, result);
        });
      }
    }, function (err, results) {
      if (err) {
        console.error(err);
        req.flash('error', err);
        return res.redirect('/admin');
      };
      return res.render('feed', {
        title: 'Entries for ' + doc.topic,
        results: results
      });
    });
  });
};

admin.prototype.deletefeed = function (req, res) {
  db.feeds.delete(req.params.id, function (err, num) {
    if (err) console.error(err);
    console.log('Deleted %s', req.params.id);
    return res.redirect('/admin');
  });
};

admin.prototype.newfeed = function (req, res) {
  return res.render('subscribe', {title: 'Subscribe'});
};

admin.prototype.subscribe = function (req, res) {
  var subs = req.param('topic').split(/[\s,]+/);

  async.forEachLimit(subs, 10, function (sub, callback) {
    if ( !validator.isURL(sub) ) {
      var message = sub + ' is not a valid URL';
      return callback(message);
    } else {
      db.feeds.updateStatus(sub, 'pending', function (err, doc) {
        if (err) return callback(err);
        console.log('Subscribing to %s', doc.topic);
        pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
          if (err) return callback(err);
          var message = result + ' to ' + doc.topic + ' at ' + moment().format();
          return callback(null, message);
        });
      });
    };
  }, function (err, results) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      return res.redirect('/subscribed');
    };
    results.forEach(function (result, index, array) {
      console.log(result);
    });
    req.flash('info', 'Successfully subscribed');
    return res.redirect('/subscribed');
  });
};

admin.prototype.resubscribe = function (req, res) {
  db.feeds.updateStatusById(req.params.id, 'pending', function (err, doc) {
    if (err) {
      console.error(err);
      req.flash('error', 'Database update failed');
      return res.redirect('/subscribed');
    };
    console.log('Resubscribing to %s', doc.topic);
    pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) {
        console.error(err);
        req.flash('error', err);
        return res.redirect('/pending');
      };
      console.log('%s to %s at %s', result, doc.topic, moment().format());
      var message = 'Resubscribed to ' + doc.topic;
      req.flash('info', message);
      return res.redirect('/subscribed');
    });
  });
};

admin.prototype.unsubscribe = function (req, res) {
  db.feeds.updateStatusById(req.params.id, 'pending', function (err, doc) {
    if (err) {
      console.error(err);
      req.flash('error', err);
      return res.redirect('/unsubscribed');
    };
    console.log('Unsubscribing from %s', doc.topic);
    pubsub.unsubscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) {
        console.error(err);
        req.flash('error', err);
        return res.redirect('/pending');
      };
      console.log('%s from %s at %s', result, doc.topic, moment().format());
      var message = 'Unsubscribed from ' + doc.topic;
      req.flash('info', message);
      return res.redirect('/unsubscribed');
    });
  });
};

admin.prototype.unsubscribed_feeds = function (req, res) {
  async.parallel({
    docs: function (callback) {
      db.feeds.listByStatus('unsubscribed', function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      db.feeds.countByStatus('unsubscribed', function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    }
  }, function (err, results) {
    if (err) {
      req.flash('error', err);
      return next(err);
    };
    return res.render('unsubscribed_feed_list', {
      title: 'Unsubscribed Feeds',
      feeds: results.docs,
      unsubscribedCount: results.count,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};

admin.prototype.subscribed_feeds = function (req, res) {
  async.parallel({
    docs: function (callback) {
      db.feeds.listByStatus('subscribed', function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      db.feeds.countByStatus('subscribed', function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    }
  }, function (err, results) {
    if (err) {
      console.error(err);
      req.flash('error', err);
      return next(err);
    };
    return res.render('subscribed_feed_list', {
      title: 'Subscribed Feeds',
      feeds: results.docs,
      subscribedCount: results.count,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};

admin.prototype.pending_feeds = function (req, res) {
  async.parallel({
    docs: function (callback) {
      db.feeds.listByStatus('pending', function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      db.feeds.countByStatus('pending', function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    }
  }, function (err, results) {
    if (err) {
      console.error(err);
      req.flash('error', err);
      return res.redirect('/admin');
    };
    return res.render('pending_feed_list', {
      title: 'Feeds pending subscription/unsubscription',
      feeds: results.docs,
      count: results.count,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};