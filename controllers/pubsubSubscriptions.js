var config = require('../config');
var pubsub = require('./pubsub.js').pubsub;
var validator = require('validator');
var moment = require('moment');
var StatusError = require('../lib/errors.js').StatusError;

/**
 * Provides the subscriptions API
 *
 * @module subscriptions
 */
module.exports.SubscriptionsController = function () {
  return new Subscriptions();
};

/**
 * Creates a subscription object.
 *
 * @class Subscriptions
 * @constructor
 */
function Subscriptions () {};

/** 
 * Subscribes to a topic
 * 
 * @method subscribe
 * @param topic {String} The URL of the topic to subscribe to
 * @return {String} Echo of the topic URL
 */
Subscriptions.prototype.subscribe = function (req, res, next) {
  if (!req.param('topic')) {
    return next(new StatusError(400, 'Topic is not specified'));
  };
  var topic = req.param('topic');

  if (!validator.isURL(topic)) {
    return next(new StatusError(400, 'Topic is not valid URL'));
  };

  // db.feeds.updateStatus(topic, 'pending', function (err, doc) {
  //   if (err) return next(err);
  //   console.log('Subscribing to %s', doc.topic);
  //   pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
  //     if (err) return next(err);
  //     console.log('%s to %s at %s', result, doc.topic, moment().format());
  //     return res.send(200, doc.topic);
  //   });
  // });

  pubsub.subscribe(topic, config.pubsub.hub, function (err, result) {
    if (err) return next(err);
    console.log('%s to %s at %s', result, doc.topic, moment().format());
    return res.send(200, doc.topic);
  });
};

/**
 * Unsubscribes from a topic
 * 
 * @method unsubscribe
 * @param topic {String} The URL of the topic to unsubscribe from
 * @return {String} Echo of the topic URL
 */
Subscriptions.prototype.unsubscribe = function (req, res, next) {
  if (!req.param('topic')) {
    return next(new StatusError(400, 'Topic is not specified'));
  };
  var topic = req.param('topic');

  if(!validator.isURL(topic)) {
    return next(new StatusError(400, 'Topic is not valid URL'));
  };

  // db.feeds.updateStatus(topic, 'pending', function (err, doc) {
  //   if (err) return next(err);
  //   console.log('Unsubscribing from %s', doc.topic);
  //   pubsub.unsubscribe(doc.topic, config.pubsub.hub, function (err, result) {
  //     if (err) return next(err);
  //     console.log('%s from %s at %s', result, doc.topic, moment().format());
  //     return res.send(200, doc.topic);
  //   });
  // });

  pubsub.unsubscribe(doc.topic, function (err, result) {
    if (err) return next(err);
    console.log('%s from %s at %s', result, doc.topic, moment().format());
    return res.send(200, doc.topic);
  });
};

/**
 * Retrieves the feed for a topic
 * 
 * @method retrieve
 * @param topic {String} The URL of the topic to retrieve
 * @param count {Number} How many entries to retrieve
 * @return {String} The result of the retrieval
 */
Subscriptions.prototype.retrieve = function (req, res, next) {
  var topic;
  var count;

  if (!req.param('topic')) {
    return next(new StatusError(400, 'Topic is not specified'));
  };
  topic = req.param('topic');

  if(!validator.isURL(topic)) {
    return next(new StatusError(400, 'Topic is not valid URL'));
  };

  var options = {
    topic: topic,
    returnFeed: true
  };

  if (req.param('count')) {
    count = req.param('count');
    options['count'] = count;
  };

  pubsub.retrieveFeed(options, function (err, result) {
    if (err) return next(err);
    return res.send(200, result);
  });
};