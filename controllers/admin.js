var config = require('../config');
var validator = require('validator');
var async = require('async');
var moment = require('moment');
var pubsub = require('./pubsub.js').pubsub;

var Feed = require('../models/feed');
var Author = require('../models/author');
var Entry = require('../models/entry');
var User = require('../models/user');
var Subscription = require('../models/subscription');

var statusOptions = Feed.statusOptions;

var dayAgo = moment().subtract('d', 1);
var weekAgo = moment().subtract('d', 7);

var admin_layout = 'admin/admin_layout';

module.exports.AdminController = function () {
  return new admin();
};

function admin () {};

// The main Admin page. Contains statistics on feed and entry counts.
admin.prototype.index = function (req, res) {
  async.parallel({
    feedCount: function (callback) {
      Feed.count({}, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    subscribedCount: function (callback) {
      Feed.count({ status: statusOptions.SUBSCRIBED }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    unsubscribedCount: function (callback) {
      Feed.count({ status: statusOptions.UNSUBSCRIBED }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    pendingCount: function (callback) {
      Feed.count({ status: statusOptions.PENDING }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    entriesCount: function (callback) {
      Entry.count({},function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    entriesInLastDay: function (callback) {
      Entry.count({ published: { $gte: dayAgo } }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    entriesInLastWeek: function (callback) {
      Entry.count({ published: { $gte: weekAgo } }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    feedsAddedInLastWeek: function (callback) {
      Feed.count({ subtime: { $gte: weekAgo } }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    usersCount: function (callback) {
      User.count({}, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
      });
    },
    subscriptionCount: function (callback) {
      Subscription.count({}, function (err, result) {
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
    return res.render('admin/admin_page', {
      layout: admin_layout,
      title: 'Admin',
      results: results,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};

// Renders a page containing a list of entries by feed.
admin.prototype.feed = function (req, res) {
  Feed.findById(req.params.id, function (err, doc) {
    if (err) {
      console.error(err);
      req.flash('error', err.message);
      return res.redirect('/admin');
    };

    async.parallel({
      entries: function (callback) {
        Entry
          .find({ topic: doc.topic })
          .limit(100)
          .sort('-published')
          .exec(function (err, docs) {
            if (err) return callback(err);
            return callback(null, docs);
          });
      },
      entriesCount: function (callback) {
        Entry.count({ topic: doc.topic }, function (err, result) {
          if (err) return callback(err);
          return callback(null, result);
        });
      },
      entriesInLastDay: function (callback) {
        Entry
          .count({ topic: doc.topic })
          .where('published').gte(dayAgo)
          .exec(function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
      },
      entriesInLastWeek: function (callback) {
        Entry
          .count({ topic: doc.topic })
          .where('published').gte(weekAgo)
          .exec(function (err, result) {
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
      return res.render('admin/feed', {
        layout: admin_layout,
        title: 'Entries for ' + title,
        results: results
      });
    });
  });
};

// Deletes a feed.
admin.prototype.deletefeed = function (req, res) {
  Feed.remove({ _id: req.params.id }, function (err, num) {
    if (err) console.error(err);
    console.log('Deleted %s', req.params.id);
    return res.redirect('/admin');
  });
};

// Renders the feed subscription page.
admin.prototype.newfeed = function (req, res) {
  return res.render('admin/subscribe', {
    title: 'Subscribe',
    layout: admin_layout
  });
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
      pubsub.subscribe(sub, config.pubsub.hub, function (err, result) {
        if (err) return callback(err);
        console.log('%s to %s at %s', result, sub, moment().format());
        return callback(null);
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
  Feed.findById(req.params.id, function (err, doc) {
    console.log('Resubscribing to %s', doc.topic);
    pubsub.subscribe(doc.topic, doc.hub, function (err, result) {
      if (err) {
        console.log('hit error ' + err);
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
  Feed.findById(req.params.id, function (err, doc) {
    console.log('Unsubscribing from %s', doc.topic);
    pubsub.unsubscribe(doc.topic, function (err, result) {
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
      Feed.find({ status: 'unsubscribed' }, function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      Feed.count({ status: statusOptions.UNSUBSCRIBED }, function (err, result) {
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
    return res.render('admin/unsubscribed_feed_list', {
      layout: admin_layout,
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
      Feed.find({ status: statusOptions.SUBSCRIBED }, function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      Feed.count({ status: statusOptions.SUBSCRIBED }, function (err, result) {
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
    return res.render('admin/subscribed_feed_list', {
      layout: admin_layout,
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
      Feed.find({ status: statusOptions.PENDING }, function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      Feed.count({ status: statusOptions.PENDING }, function (err, result) {
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
    return res.render('admin/pending_feed_list', {
      layout: admin_layout,
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
      Author.find(function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
      });
    },
    count: function (callback) {
      Author.count(function (err, result) {
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
    return res.render('admin/authors', {
      layout: admin_layout,
      title: 'Authors',
      authors: results.docs,
      count: results.count
    }); 
  });
};

admin.prototype.authorEntries = function (req, res) {
  Author.findById(req.params.id, function (err, author) {
    if (err) {
      console.error(err);
      req.flash('error', err.message);
      return res.redirect('/admin');
    };
    console.log(author._id);
    async.parallel({
      entries: function (callback) {
        Entry
          .find({ 'author._id': author._id })
          .limit(100)
          .sort('-published')
          .exec(function (err, docs) {
            if (err) return callback(err);
            return callback(null, docs);
          });
      },
      entriesCount: function (callback) {
        Entry
          .count({ 'author._id': author._id })
          .exec(function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
      },
      entriesInLastDay: function (callback) {
        Entry
          .count({ 'author._id': author._id })
          .where('published').gte(dayAgo)
          .exec(function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
      },
      entriesInLastWeek: function (callback) {
        Entry
          .count({ 'author._id': author._id })
          .where('published').gte(weekAgo)
          .exec(function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
      },
      subscriberCount: function (callback) {
        Subscription
          .count({ authorId: author._id })
          .exec(function (err, result) {
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
      return res.render('admin/authorEntries', {
        layout: admin_layout,
        title: 'Entries for ' + author.displayName,
        author: author,
        results: results,
        error: req.flash('error'),
        message: req.flash('info')
      });
    });
  });
};

admin.prototype.users = function (req, res) {
  async.parallel({
    users: function (callback) {
      User
      .find({})
      .exec(function (err, results) {
        if (err) return callback(err);
        return callback(null, results);
      });
    },
    usersCount: function (callback) {
      User.count({}).exec(function (err, result) {
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
    return res.render('admin/users', {
      layout: admin_layout,
      title: 'Users',
      results: results,
      error: req.flash('error'),
      message: req.flash('info')
    });
  });
};

admin.prototype.user = function (req, res) {
  User.findById(req.params.id, function (err, user) {
    if (err) return pathError(err, req, res, '/admin');
    Subscription.find({ email: user.email }).exec(function (err, results) {
      if (err) return pathError(err, req, res, '/admin');
      return res.render('admin/user', {
        layout: admin_layout,
        title: 'Subscriptions for ' + user.email,
        results: results,
        error: req.flash('error'),
        message: req.flash('info')
      });
    });
  });
};

admin.prototype.userFeed = function (req, res) {
  User.findById(req.params.id, function (err, user) {
    if (err) return pathError(err, req, res, '/admin');

    async.waterfall([
      function (callback) {
        Subscription.find({ userId: user._id }).select('authorId').exec(function (err, results) {
          if (err) return callback(err);
          return callback(null, results);
        });
      },
      function (results, callback) {
        var subs = [];
        for (var i = results.length - 1; i >= 0; i--) {
          subs.push(results[i].authorId);
        };
        callback(null, subs);
      },
      function (subs, callback) {
        Entry.find({ 'author._id': { $in: subs } }).sort('-published').limit(100).exec(function (err, entries) {
          if (err) return callback(err);
          return callback(null, entries);
        });
      }
    ], function (err, entries) {
      if (err) {
        console.error(err);
        req.flash('error', err.message);
        return res.redirect('/admin');
      };
      return res.render('admin/user_feed', {
        layout: admin_layout,
        title: 'Entries for ' + user.email,
        results: entries,
        error: req.flash('error'),
        message: req.flash('info')
      });
    });
  });
};

function pathError(err, req, res, path) {
  console.error(err.stack);
  req.flash('error', err.message);
  return res.redirect(path);
};