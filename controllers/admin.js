var db = require('../models/db.js');
var config = require('../config.json');
var validator = require('validator');
var async = require('async');
var moment = require('moment');
var pubsub = require('./pubsub.js').pubsub;


module.exports.AdminController = function () {
  return new admin();
};

function admin () {};

// The main Admin page. Contains statistics on feed and entry counts.
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
      req.flash('error', err.message);
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

// Renders a page containing a list of entries by feed.
admin.prototype.feed = function (req, res) {
  db.feeds.findOneById(req.params.id, function (err, doc) {
    if (err) {
      console.error(err);
      req.flash('error', err.message);
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
        req.flash('error', err.message);
        return res.redirect('/admin');
      };
      var title = doc.title || doc.topic;
      return res.render('feed', {
        title: 'Entries for ' + title,
        results: results
      });
    });
  });
};

// Deletes a feed.
admin.prototype.deletefeed = function (req, res) {
  db.feeds.delete(req.params.id, function (err, num) {
    if (err) console.error(err);
    console.log('Deleted %s', req.params.id);
    return res.redirect('/admin');
  });
};

// Renders the feed subscription page.
admin.prototype.newfeed = function (req, res) {
  return res.render('subscribe', {title: 'Subscribe'});
};

// Subscribes to a list of feeds.
// Requires a 'topic' parameter in the body, containing a list of feeds
// to subscribe to separated by newline, space, tab, or comma characters.
admin.prototype.subscribe = function (req, res) {
  if (!req.param('topic')) {
    var err = new Error('Topic not specified');
    console.error(err.stack);
    req.flash('error', err.message);
    return res.redirect('/admin/subscribed');
  };
  
  var subs = req.param('topic').split(/[\s,]+/);

  async.forEachLimit(subs, 10, function (sub, callback) {
    if ( !validator.isURL(sub) ) {
      return callback(new Error(sub + ' is not a valid URL'));
    } else {
      db.feeds.updateStatus(sub, 'pending', function (err, doc) {
        if (err) return callback(err);
        console.log('Subscribing to %s', doc.topic);
        pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
          if (err) return callback(err);
          console.log('%s to %s at %s', result, doc.topic, moment().format());
          return callback(null);
        });
      });
    };
  }, function (err, results) {
    if (err) {
      console.error(err);
      req.flash('error', err.message);
      return res.redirect('/admin/subscribed');
    };
    req.flash('info', 'Successfully subscribed');
    return res.redirect('/admin/subscribed');
  });
};

// Sends a subscription request for an already existing feed.
admin.prototype.resubscribe = function (req, res) {
  db.feeds.updateStatusById(req.params.id, 'pending', function (err, doc) {
    if (err) {
      console.error(err);
      req.flash('error', err.message);
      return res.redirect('/admin/subscribed');
    };
    console.log('Resubscribing to %s', doc.topic);
    pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) {
        console.error(err.stack);
        req.flash('error', err.message);
        return res.redirect('/admin/pending');
      };
      console.log('%s to %s at %s', result, doc.topic, moment().format());
      var message = 'Resubscribed to ' + doc.topic;
      req.flash('info', message);
      return res.redirect('/admin/subscribed');
    });
  });
};

// Sends an unsubscribe request for a feed.
admin.prototype.unsubscribe = function (req, res) {
  db.feeds.updateStatusById(req.params.id, 'pending', function (err, doc) {
    if (err) {
      console.error(err);
      req.flash('error', err.message);
      return res.redirect('/admin/unsubscribed');
    };
    console.log('Unsubscribing from %s', doc.topic);
    pubsub.unsubscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) {
        console.error(err);
        req.flash('error', err.message);
        return res.redirect('/admin/pending');
      };
      console.log('%s from %s at %s', result, doc.topic, moment().format());
      var message = 'Unsubscribed from ' + doc.topic;
      req.flash('info', message);
      return res.redirect('/admin/unsubscribed');
    });
  });
};

// Renders a page containing a list of all feeds with the 'unsubscribed' status.
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
      console.log(err.stack);
      req.flash('error', err.message);
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

// Renders a page containing a list of feeds with the 'subscribed' status.
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
      req.flash('error', err.message);
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

// Renders a page containing a list of feeds with the 'pending' status.
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
      req.flash('error', err.message);
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

admin.prototype.authors = function (req, res) {
  async.parallel({
    docs: function (callback) {
      db.authors.listAll(function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      db.authors.count(function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    }
  }, function (err, results) {
    if (err) {
      console.error(err);
      req.flash('error', err.message);
      return res.redirect('/admin');
    };
    return res.render('authors', {
      title: 'Authors',
      authors: results.docs,
      count: results.count
    }); 
  });
};

admin.prototype.authorEntries = function (req, res) {
  console.log(req.params);
  db.authors.findOne(req.params.id, function (err, result) {
    console.log(result);
    db.entries.listByAuthor(result.id, 100, function (err, docs) {
      if (err) {
        console.error(err);
        req.flash('error', err.message);
        return res.redirect('/admin');
      };
      return res.render('authorEntries', {
        title: 'Entries for '+result.displayName,
        entries: docs
      });
    });
  });
};

function error(err, req, path) {
  console.error(err.stack);
  req.flash('error', err.message);
  return req.redirect(path);
};