var express = require('express');
var feedsCtrl = require('../controllers/feeds.js').FeedsController();

var feeds = express.Router();

feeds.get('/feed/:id', feedsCtrl.getFeed);

feeds.use(statusErrorHandler);
feeds.use(errorHandler);

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

module.exports.feeds = feeds;