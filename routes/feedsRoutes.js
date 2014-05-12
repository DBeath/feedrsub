var express = require('express');
var feedsCtrl = require('../controllers/feeds.js').FeedsController();

var feeds = express.Router();

feeds.get('/feed/:id', feedsCtrl.getFeed);

module.exports.feeds = feeds;