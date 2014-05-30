var db = require('../models/db.js');
var config = require('../config');
var validator = require('validator');
var moment = require('moment');
var StatusError = require('../lib/errors.js').StatusError;

/**
 * Provides the feeds API
 *
 * @module feeds
 */
module.exports.FeedsController = function () {
  return new Feeds();
};

/**
 * Creates a Feeds object.
 *
 * @class Feeds
 * @constructor
 */
function Feeds () {};

/** 
 * Gets a single feed
 * 
 * @method getFeed
 * @param topic {String} The URL of the feed to get
 * @return {JSON} The feed object
 */
Feeds.prototype.getFeed = function (req, res, next) {
  if (!validator.isHexadecimal(req.params.id)) {
    return next(new StatusError(400, 'Id is not valid'));
  };

  db.feeds.findOneById(req.params.id, function (err, doc) {
    if (err) return next(err);
    console.log(doc);
    return res.send(200, doc);
  });
};