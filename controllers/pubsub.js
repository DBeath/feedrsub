var config = require('../config.json');
var mongo = require('../models/mongodb.js');
var request = require('request');
var urllib = require('url');
var crypto = require('crypto');

module.exports.pubsubController = function (options) {
  return new pubsub(options);
};

function pubsub (options) {
  this.secret = options.secret || false;
  this.callbackurl = options.callbackurl;
  this.format = options.format || 'json';

  if (options.username) {
    this.auth = {
      'user': options.username,
      'pass': options.password,
      'sendImmediately': true
    }
  };   
};

pubsub.prototype.verification = function (req, res) {
  var params = urllib.parse(req.url, true, true);
  var data;

  if(!params.query['hub.topic'] || !params.query['hub.mode'])
};

pubsub.prototype.notification = function (req, res) {

};

pubsub.prototype.subscribe = function (req, res) {

};

pubsub.prototype.unsubscribe = function (req, res) {

};

pubsub.prototype.sendError = function (req, res, code, message) {

};