var db = require('../models/db.js');
var config = require('../config.json');
var pubsub = require('./pubsub.js').pubsub;
var validator = require('validator');
var moment = require('moment');

module.exports.SubscriptionsController = function () {
  return new subscriptions();
};

function subscriptions () {};

// Subscribes to a topic
// Takes a query with the 
subscriptions.prototype.subscribe = function (req, res, next) {
  if (!req.param('topic')) {
    return next(new StatusError(400, 'Topic is not specified'));
  };
  var topic = req.param('topic');
  if (!validator.isURL(topic)) {
    return next(new StatusError(400, 'Topic is not valid URL'));
  };

  db.feeds.updateStatus(topic, 'pending', function (err, doc) {
    if (err) return next(err);
    console.log('Subscribing to %s', doc.topic);
    pubsub.subscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) return next(err);
      console.log('%s to %s at %s', result, doc.topic, moment().format());
      return res.send(200, 'Subscribed to '+doc.topic);
    });
  });
};

subscriptions.prototype.unsubscribe = function (req, res, next) {
  if (!req.param('topic')) {
    return next(new StatusError(400, 'Topic is not specified'));
  };
  var topic = req.param('topic');
  if(!validator.isURL(topic)) {
    return next(new StatusError(400, 'Topic is not valid URL'));
  };
  db.feeds.updateStatus(topic, 'pending', function (err, doc) {
    if (err) return next(err);
    console.log('Unsubscribing from %s', doc.topic);
    pubsub.unsubscribe(doc.topic, config.pubsub.hub, function (err, result) {
      if (err) return next(err);
      console.log('%s from %s at %s', result, doc.topic, moment().format());
      return res.send(200, 'Unsubscribed from '+doc.topic);
    });
  });
};

subscriptions.prototype.retrieve = function (req, res, next) {

};

function StatusError(code, message) {
  this.statusCode = code || 500;
  this.message = message || 'Something went wrong';
};
StatusError.prototype = new Error();
StatusError.prototype.constructor = StatusError;