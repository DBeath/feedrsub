var config = require('../config.json');
var mongo = require('../models/mongodb.js');
var request = require('request');
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

  this.pending = {};   
};

pubsub.prototype.verification = function (req, res) {
  var data;

  if ( !req.query['hub.topic'] || !req.query['hub.mode'] ) {
    return this.sendError(req, res, 400, 'Bad Request');
  };

  switch ( req.query['hub.mode'] ) {
    case 'denied':
      res.send(200, req.query['hub.challenge']);
    case 'subscribe':
    case 'unsubscribe':
      res.send(200, req.query['hub.challenge']);
  }
};

pubsub.prototype.notification = function (req, res) {

};

pubsub.prototype.subscribe = function (req, res) {

};

pubsub.prototype.setSubscription = function (mode, topic, hub, callback) {
  var uniqueCallbackUrl = callbackurl + 
    (callbackurl.replacereplace(/^https?:\/\//i, "").match(/\//)?"":"/") +
    (callbackurl.match(/\?/)?"&":"?") +
    'topic=' + encodeURIComponent(topic) + 
    '&hub=' + encodeURIComponent(hub);

  var form = {
    'hub.callback': uniqueCallbackUrl;
    'hub.mode': mode,
    'hub.topic': topic,
    'hub.verify': 'sync'
  };

  if (this.secret) {
    form['hub.secret'] = crypto.createHmac("sha1", this.secret).update(topic).digest("hex");
  };

  if (this.format === 'json' || this.format === 'JSON') {
    form['format'] = 'json';
  };

  var postParams = {
    url: hub,
    form: form,
    encoding: 'utf-8'
  };

  if (this.auth) {
    postParams.auth = this.auth;
  };

  request.post(postParams, function (err, res, body) {
    if (err) console.log(err);

    if (res.statusCode === 202) {
      callback(null, 'Accepted');
    } else {
      console.log('%s Denied', res.statusCode);
    };
  })
};

pubsub.prototype.unsubscribe = function (req, res) {

};

pubsub.prototype.sendError = function (req, res, code, message) {

};