var config = require('../config');
var StatusError = require('../lib/errors.js').StatusError;
var RSS = require('rss');
var async = require('async');
var validator = require('validator');
var moment = require('moment');

var User = require('../models/user');
var Entry = require('../models/entry');
var Subscription = require('../models/subscription');

module.exports.UsersController = function () {
  return new Users();
};

function Users () {};

Users.prototype.rss = function (req, res, next) {
  if (!req.params.id) {
    return next(new StatusError(400, 'UserID not given.'));
  };

  if (!validator.isHexadecimal(req.params.id)) {
    return next(new StatusError(400, 'UserID is not valid.'));
  };

  User.findById(req.params.id, function (err, user) {
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
      },
      function (entries, callback) {
        var feed = new RSS({
          title: 'Entries for ' + user.email,
          description: 'Custom rss feed for ' + user.email,
          feed_url: config.pubsub.domain + req.originalUrl,
          site_url: config.pubsub.domain,
          ttl: '60'
        });

        async.eachSeries(entries, function (entry, cb) {
          var content = entry.content || entry.summary;

          feed.item({
            title: entry.title,
            description: content,
            date: moment.unix(entry.published),
            author: entry.author.displayName,
            url: entry.permalinkUrl,
            guid: entry._id.toHexString()
          });

          return cb();
        }, function (err) {
          if (err) return callback(err);
          var xml = feed.xml();
          return callback(null, xml);
        })
      }
    ], function (err, xml) {
      if (err) return next(err);
      return res.send(200, xml);
    });
  });
};