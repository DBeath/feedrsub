var config = require('../config.json');
var mongo = require('../models/mongodb.js');
var request = require('request');
var crypto = require('crypto');
var util = require('util');
var events = require('events');
var moment = require('moment');

// var pubsubController;

module.exports.PubsubController = function () {
  var pubsub = new Pubsub({
    secret: config.pubsub.secret,
    domain: config.pubsub.domain,
    format: config.pubsub.format,
    username: config.pubsub.username,
    password: config.pubsub.password
  });

  module.exports.pubsub = pubsub;
  return pubsub;
};

function Pubsub (options) {
  this.secret = options.secret || false;
  this.callbackurl = options.domain + '/pubsubhubbub';
  this.format = options.format || 'json';

  if (options.username) {
    this.auth = {
      'user': options.username,
      'pass': options.password,
      'sendImmediately': true
    }
  };
  // Array of Subscriptions pending verification
  // this.pending = [];   
};

util.inherits(Pubsub, events.EventEmitter);

// Handles verification of intent from hub.
Pubsub.prototype.verification = function (req, res) {
  var data;
  var topic = req.query['hub.topic'] || false;
  var mode = req.query['hub.mode'] || false;
  var challenge = req.query['hub.challenge'] || false;

  if ( !topic || !mode || !challenge) {
    return res.send(400);
  };

  switch ( mode ) {
    case 'denied':
      res.send(200);
      mongo.feeds.unsubscribe(topic, function (err, result) {
        if (err) console.log(err);
        console.log('unsubscribed from %s', topic);
      });
      break;
    case 'subscribe':
      mongo.feeds.findOneByTopic(topic, function (err, doc) {
        if (err) {
          res.send(404);
          console.log(err);
        };
        if (doc.status === 'pending') {
          res.send(200, challenge);
          // mongo.feeds.subscribe(topic, function (err, result) {
          //   if (err) console.log(err);
          //   console.log('Subscribed to %s at %s', topic, moment().format());
          // });
        } else {
          res.send(404);
        };
      });
      break;
    case 'unsubscribe':
      mongo.feeds.findOneByTopic(topic, function (err, doc) {
        if (err) {
          res.send(404);
          console.log(err);
        };
        if (doc.status === 'pending') {
          res.send(200, challenge);
          // mongo.feeds.unsubscribe(topic, function (err, result) {
          //   if (err) console.log(err);
          //   console.log('Unsubscribed from %s at %s', topic, moment().format());
          // });
        } else {
          res.send(404);
        };
      });

      // var index = pending.indexOf(topic);
      // if (index > -1) {
      //   res.send(200, challenge);
      //   mongo.feeds.subscribe(topic, function (err, result) {
      //     if (err) console.log(err);
      //     console.log('subscribed to %s', topic);
      //   });
      //   pending.slice(index);
      // } else {
      //   res.send(404);
      // };
      break;
    default:
      res.send(403);    
  };
};

// Called when the hub notifies the subscriber with new data.
Pubsub.prototype.notification = function (req, res) {
  var topic = req.query['hub.topic'] || false;
  var hub = req.query['hub'] || false;
  var signatureParts, signature, algo, hmac;
  var bodyChunks = [];

  (req.get('link') || '').
    replace(/<([^>]+)>\s*(?:;\s*rel=['"]([^'"]+)['"])?/gi, function (o, url, rel) {
      switch((rel || '').toLowerCase()) {
        case 'self':
          topic = url;
          break;
        case 'hub':
          hub = url;
          break;
      };
    });

  if (!topic) {
    return res.send(400);
  };

  if (this.secret && !req.get('x-hub-signature')) {
    return res.send(403);
  };

  if (this.secret) {
    signatureParts = req.get('x-hub-signature').split('=');
    algo = (signatureParts.shift() || '').toLowerCase();
    signature = (signatureParts.pop() || '').toLowerCase();

    try {
      hmac = crypto.createHmac(algo, crypto.createHmac('sha1', this.secret).update(topic).digest('hex'));
    } catch(E) {
      return res.send(403);
    };
  };

  req.on('data', (function (chunk) {
    if (!chunk) {
      return;
    };

    bodyChunks.push(chunk);

    if (this.secret) {
      hmac.update(chunk);
    };
  }).bind(this));

  req.on('end', (function () {
    // Must return 2xx code even if signature doesn't match.
    if (this.secret && hmac.digest('hex').toLowerCase() != signature) {
      return res.send(202);
    };

    console.log('Received notification from %s at %s', topic, moment().format());
    res.send(204);

    this.emit('feed_update', {
      topic: topic,
      hub: hub,
      feed: Buffer.concat(bodyChunks),
      headers: req.headers
    });
  }).bind(this));
};

Pubsub.prototype.subscribe = function (topic, hub) {
  this.sendSubscription('subscribe', topic, hub, function (err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
};

Pubsub.prototype.unsubscribe = function (topic, hub) {
  this.sendSubscription('unsubscribe', topic, hub, function (err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
};

// Sends a subscribe or unsubscribe request to the hub
Pubsub.prototype.sendSubscription = function (mode, topic, hub, callback) {
  var uniqueCallbackUrl = this.callbackurl + 
    (this.callbackurl.replace(/^https?:\/\//i, "").match(/\//)?"":"/") +
    (this.callbackurl.match(/\?/)?"&":"?") +
    'topic=' + encodeURIComponent(topic) + 
    '&hub=' + encodeURIComponent(hub);

  var form = {
    'hub.callback': uniqueCallbackUrl,
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

  request.post(postParams, function (err, response, body) {
    if (err) console.log(err);

    if (response.statusCode === 202) {
      // pending.push(topic);
      switch ( mode ) {
        case 'subscribe':
          mongo.feeds.subscribe(topic, function (err, result) {
            if (err) console.log(err);
            callback(null, 'Subscribed');
          });
          break;
        case 'unsubscribe':
          mongo.feeds.unsubscribe(topic, function (err, result) {
            if (err) console.log(err);
            callback(null, 'Unsubscribed');
          });
          break;
      }; 
      // mongo.feeds.updateStatus(topic, mode, function (err, result) {
      //   if (err) console.log(err);
      //   callback(null, 'Accepted');
      // });
    } else {
      callback('Subscription failed', null);
    };
  });
};