var db = require('../models/db.js');
var config = require('../config');
var StatusError = require('../lib/errors.js').StatusError;
var RSS = require('rss');
var async = require('async');
var validator = require('validator');

module.exports.AuthorsController = function () {
  return new Authors();
};

function Authors () {};

Authors.prototype.list = function (req, res, next) {
  db.authors.listAll(function (err, result) {
    if (err) return next(err);
    return res.send(200, result);
  });
};

Authors.prototype.authorEntries = function (req, res, next) {
  if (!req.param('author')) {
    return next(new StatusError(400, 'Author is not specified'));
  };

  db.authors.findOne(req.param('author'), function (err, author) {
    if (err) return next(err);
    db.entries.listByAuthor(author._id, 10, function (err, entries) {
      if (err) return next(err);
      res.send(200, entries);
    });
  });
};

Authors.prototype.rss = function (req, res, next) {
  var param = null;
  var paramType = null;

  if (req.param('author')) {
    param = req.param('author');
    paramType = 'name';
  } else if (req.params.id) {
    if (validator.isHexadecimal(req.params.id)) {
      param = req.params.id;
      paramType = 'id';
    };
  } else {
    return next(new StatusError(400, 'Author is not specified'));
  };

  async.waterfall([
      function (callback) {
        switch (paramType) {
          case 'name':
            db.authors.findOne(param, function (err, author) {
              if (err) return callback(err);
              return callback(null, author);
            });
            break;
          case 'id':
            db.authors.findOneById(param, function (err, author) {
              if (err) return callback(err);
              return callback(null, author);
            });
            break;
          default:
            return callback(new Error('Invalid parameter'));
            break;
        };
      },
      function (author, callback) {
        var feed = new RSS({
          title: author.displayName,
          description: 'Articles by '+ author.displayName,
          feed_url: config.pubsub.domain + req.originalUrl,
          site_url: config.pubsub.domain,
          author: author.displayName,
          ttl: '60'
        });

        db.entries.listByAuthor(author._id, 10, function (err, entries) {
          if (err) return next(err);

          async.eachSeries(entries, function (entry, cb) {
            feed.item({
              title: entry.title,
              description: entry.content,
              date: entry.published,
              author: entry.actor.displayName,
              url: entry.permalinkUrl,

            });
            cb();
          }, function (err) {
            var xml = feed.xml();
            callback(null, xml);
          });
        });
      }
  ], function (err, result) {
    if (err) return next(err);
    return res.send(200, result);
  });
};