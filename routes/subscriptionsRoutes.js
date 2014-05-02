var express = require('express');
var subscriptions = require('../controllers/subscriptions.js').SubscriptionsController();

var subs = express.Router();

subs.post('/subscribe', subscriptions.subscribe);
subs.post('/unsubscribe', subscriptions.unsubscribe);

subs.use(statusErrorHandler);
subs.use(errorHandler);

function statusErrorHandler(err, req, res, next) {
  if (!err.statusCode) {
    return next(err);
  };
  console.error(err);
  res.send(err.statusCode, err.message);
};

function errorHandler(err, req, res, next) {
  console.log('hit errorHandler');
  console.error(err);
  res.send(500, err.message);
};

module.exports.subs = subs;