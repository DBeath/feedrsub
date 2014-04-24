var express = require('express');
var pubsubController = require('../controllers/pubsub.js').pubsub;

var pubsub = express.Router();

pubsub.get('/', pubsubController.verification.bind(pubsubController) );
pubsub.post('/', pubsubController.notification.bind(pubsubController) );

module.exports.pubsub = pubsub;