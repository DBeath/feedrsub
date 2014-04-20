var config = require('../config.json');
var db = require('../models/mongodb.js');
var request = require('request');
var crypto = require('crypto');
var util = require('util');
var events = require('events');
var moment = require('moment');

module.exports.createController = function (options) {
  return new Pubsub(options);
};

// Pubsub class to control pubsubhubbub subscriptions.
// Conforms to pubsubhubbub v0.4 specification.
// https://pubsubhubbub.googlecode.com/svn/trunk/pubsubhubbub-core-0.4.html
function Pubsub (options) {
  events.EventEmitter.call(this);

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
};

util.inherits(Pubsub, events.EventEmitter);

// Handles verification of intent from hub.
Pubsub.prototype.verification = function (req, res) {
  var data;
  var topic = req.query['hub.topic'] || false;
  var mode = req.query['hub.mode'] || false;
  var challenge = req.query['hub.challenge'] || false;
  var lease_seconds = req.query['lease_seconds'] || false;

  if ( !topic || !mode || !challenge) {
    return res.send(400);
  };

  switch ( mode ) {
    // If sent denied then unsubscribe from topic.
    case 'denied':
      res.send(200);
      db.feeds.unsubscribe(topic, function (err, result) {
        if (err) return console.log(err);
        return console.log('Unsubscribed from %s', topic);
      });
      break;
    // If subscribing or unsubscribing check that topic is pending, then echo challenge.
    case 'subscribe':
    case 'unsubscribe':
      db.feeds.findOneByTopic(topic, function (err, doc) {
        if (err) {
          console.error(err);
          return res.send(403);
        };
        if (doc.status === 'pending') {
          if (lease_seconds && mode === 'subscribe') {
            db.feeds.updateLeaseSeconds(topic, lease_seconds, function (err, result) {
              if (err) {
                console.error(err);
                return res.send(403);
              };
              return res.send(200, challenge);
            });
          } else {
            return res.send(200, challenge);
          };
        } else {
          return res.send(404);
        };
      });
      break;
    default:
      return res.send(403);    
  };
};

// Called when the hub notifies the subscriber with new data.
Pubsub.prototype.notification = function (req, res) {
  var topic = req.query['hub.topic'] || false;
  var hub = req.query['hub'] || false;
  var signatureParts, signature, algo, hmac;
  var bodyChunks = [];

  // Replace topic and hub values with values from url.
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

  // Must have topic.
  if (!topic) {
    console.log('Notification did not contain topic');
    return res.send(400);
  };

  // Topic must be in the database, else discard notification. 
  db.feeds.findOneByTopic(topic, (function (err, doc) {
    if (err) {
      console.log(err);
      return res.send(403);
    };

    // Send 403 if topic is not in database.
    if (!doc) {
      console.log('Not subscribed to %s', topic);
      return res.send(403);
    };

    // Send 403 if notification should have secret but does not.
    if (doc.secret && !req.get('x-hub-signature')) {
      console.log('Notification did not contain secret signature');
      return res.send(403);
    };

    // Create HMAC for secret.
    if (doc.secret) {
      signatureParts = req.get('x-hub-signature').split('=');
      algo = (signatureParts.shift() || '').toLowerCase();
      signature = (signatureParts.pop() || '').toLowerCase();

      try {
        hmac = crypto.createHmac(algo, doc.secret);
      } catch (e) {
        console.log(e);
        return res.send(403);
      };
    };

    // Read data.
    req.on('data', (function (chunk) {
      if (!chunk) {
        return;
      };

      bodyChunks.push(chunk);

      // Update HMAC on data read.
      if (doc.secret) {
        try {
          hmac.update(chunk);
        } catch (e) {
          console.log(e);
          return res.send(403);
        };
      };
    }).bind(this)); 

    // Emit event once data finished reading.
    req.on('end', (function () {

      // Must return 2xx code even if signature doesn't match.
      if (doc.secret && hmac.digest('hex').toLowerCase() != signature) {
        return res.send(202);
      };

      // Send acknowledgement of valid notification.
      console.log('Received notification from %s at %s', topic, moment().format());
      res.send(204);

      // Emit notification event.
      this.emit('feed_update', {
        topic: topic,
        hub: hub,
        feed: Buffer.concat(bodyChunks),
        headers: req.headers
      });
    }).bind(this)); 

  }).bind(this));
};

Pubsub.prototype.subscribe = function (topic, hub, callback) {
  this.sendSubscription('subscribe', topic, hub, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

Pubsub.prototype.unsubscribe = function (topic, hub, callback) {
  this.sendSubscription('unsubscribe', topic, hub, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

// Sends a subscribe or unsubscribe request to the hub
Pubsub.prototype.sendSubscription = function (mode, topic, hub, callback) {
  var uniqueCallbackUrl = this.callbackurl + 
    (this.callbackurl.replace(/^https?:\/\//i, "").match(/\//)?"":"/") +
    (this.callbackurl.match(/\?/)?"&":"?") +
    'topic=' + encodeURIComponent(topic) + 
    '&hub=' + encodeURIComponent(hub);

  var feedSecret = false;

  var form = {
    'hub.callback': uniqueCallbackUrl,
    'hub.mode': mode,
    'hub.topic': topic,
    'hub.verify': 'sync'
  };

  if (this.format === 'json' || this.format === 'JSON') {
    form['format'] = 'json';
  };

  db.feeds.findOneByTopic(topic, (function (err, feed) {
    if (err) {
      return callback(err);
    };

    // If feed already has a secret then use that, else create one if config has secret.
    if (feed.secret) {
      form['hub.secret'] = feed.secret;
    } else {
      if (this.secret && mode === 'subscribe') {
        try {
          feedSecret = crypto.createHmac("sha1", this.secret).update(topic).digest("hex");
          form['hub.secret'] = feedSecret;
        } catch (err) {
          return callback(err);
        };
      };
    };

    var postParams = {
      url: hub,
      form: form,
      encoding: 'utf-8'
    };

    if (this.auth) {
      postParams.auth = this.auth;
    };

    // Send request
    request.post(postParams, function (err, response, body) {
      if (err) return callback(err);

      // If successful then move feed out of 'pending' status and update subtime/unsubtime.
      if (response.statusCode === 202 || response.statusCode === 204) {
        switch ( mode ) {
          case 'subscribe':
            db.feeds.subscribe(topic, feedSecret, function (err, result) {
              if (err) return callback(err);
              return callback(null, 'Subscribed');
            });
            break;
          case 'unsubscribe':
            db.feeds.unsubscribe(topic, function (err, result) {
              if (err) return callback(err);
              return callback(null, 'Unsubscribed');
            });
            break;
        }; 
      } else {
        var message = 'Subscription failed because: ' + body;
        return callback(message);
      };
    });
  }).bind(this));
};