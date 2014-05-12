var express = require('express');
var subscriptions = require('../controllers/subscriptions.js').SubscriptionsController();

var subs = express.Router();

subs.post('/subscribe', subscriptions.subscribe);
subs.post('/unsubscribe', subscriptions.unsubscribe);
subs.post('/retrieve', subscriptions.retrieve);

module.exports.subs = subs;