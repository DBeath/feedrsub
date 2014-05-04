var config = require('../config.json');
var db = require('../models/db.js');
var request = require('request');
var crypto = require('crypto');
var util = require('util');
var events = require('events');
var moment = require('moment');
var http = require('http');

/**
 * Provides the base Pubsubhubbub controller
 *
 * @module Pubsub
 */
module.exports.createController = function (options) {
  return new Pubsub(options);
};

/**
 * Controls all Pubsubhubbub functions
 * Conforms to pubsubhubbub v0.4 specification
 * https://pubsubhubbub.googlecode.com/svn/trunk/pubsubhubbub-core-0.4.html
 * 
 * @class Pubsub
 * @constructor
 */
function Pubsub (options) {
  events.EventEmitter.call(this);

  this.secret = options.secret || false;
  this.callbackurl = options.domain + '/pubsubhubbub';
  this.format = options.format || 'json';
  this.retrieve = options.retrieve || false;
  this.verify = options.verify || false;

  if (options.username) {
    this.auth = {
      'user': options.username,
      'pass': options.password,
      'sendImmediately': true
    }
  };
};

util.inherits(Pubsub, events.EventEmitter);

/**
 * Handles verification of intent from hub
 *
 * @method verification
 */
Pubsub.prototype.verification = function (req, res) {
  var data;
  var topic = req.query['hub.topic'] || false;
  var mode = req.query['hub.mode'] || false;
  var challenge = req.query['hub.challenge'] || false;
  var lease_seconds = req.query['lease_seconds'] || false;

  // Verfication must contain topic, mode, and challenge
  if ( !topic || !mode || !challenge) {
    console.log('Verification request was not valid');
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
                return console.error(err);
              };
              console.log('Updated lease time for %s', topic);
            });
          };
          return res.send(200, challenge);
        } else {
          return res.send(404);
        };
      });
      break;
    default:
      return res.send(403);    
  };
};

/**
 * Called when the hub notifies the subscriber with new data
 *
 * @method notification
 */
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

  // Must have valid hub.
  if (!hub) {
    console.log('Notification did not contain hub');
    return res.send(400);
  };

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
      console.log('Received valid notification from %s at %s', topic, moment().format());
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

/**
 * Sends a subscribe request
 *
 * @method subscribe
 * @param topic {String} The URL of the topic to subscribe to
 * @param hub {String} The URL of the hub to send the request to
 * @param callback {Function} Callback containing error and result
 */
Pubsub.prototype.subscribe = function (topic, hub, callback) {
  this.sendSubscription('subscribe', topic, hub, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Sends an unsubscribe request
 *
 * @method unsubscribe
 * @param topic {String} The URL of the topic to unsubscribe from
 * @param hub {String} The URL of the hub to send the request to
 * @param callback {Function} Callback containing error and result
 */
Pubsub.prototype.unsubscribe = function (topic, hub, callback) {
  this.sendSubscription('unsubscribe', topic, hub, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Sends a subscribe or unsubscribe request to the hub
 *
 * @method sendSubscription
 * @param mode {String} The purpose of the request: 'subscribe' or 'unsubscribe'
 * @param topic {String} The URL of the topic to subscribe/unsubscribe to
 * @param hub {String} The URL of the hub to send the request to
 * @param callback {Function} Callback containing error and result
 */
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
  };

  if (this.format === 'json' || this.format === 'JSON') {
    form['format'] = 'json';
  };

  if (this.retrieve && mode === 'subscribe') {
    form['retrieve'] = true;
  };

  if (this.verify) {
    form['hub.verify'] = this.verify;
  };

  // Only attempt subscription/unsubscription if feed in database 
  db.feeds.findOneByTopic(topic, (function (err, feed) {
    if (err) return callback(err);

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
      encoding: 'utf-8',
      timeout: 2000
    };

    if (this.auth) {
      postParams.auth = this.auth;
    };

    request.post(postParams, (function (err, res, body) {
      if (err) {
        if (err.code === 'ETIMEDOUT') {
          return callback(new Error('Request to '+hub+' timed out'));
        };
        return callback(err);
      }

      // Subscription was successful
      if (res.statusCode === 202 || res.statusCode === 204 || res.statusCode === 200) {
        
        // Subscription contains feed body
        if (res.statusCode === 200) {
          // Emit notification event.
          this.emit('feed_update', {
            topic: topic,
            hub: hub,
            feed: body,
            headers: res.headers
          });
        } else if (this.retrieve && mode === 'subscribe') {
          setTimeout((function () {
            this.retrieveFeed({topic: topic, count: 20}, function (err, result) {
              if (err) return console.log(err);
              return console.log(result);
            });
          }).bind(this), 500);
        };

        // Set feed to subscribed/unsubscribed
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

      // Subscription failed, reason in body
      } else if (res.statusCode === 422) {
        return callback(new StatusError(422, 'Subscription failed: ' + body));
      // Subscription failed with other code
      } else {
        return callback(new StatusError(res.statusCode, 'Subscription failed: '+http.STATUS_CODES[res.statusCode]));
      };
    }).bind(this));

  }).bind(this));
};

/**
 * Retrieve entries from a feed
 * 
 * @method retrieveFeed
 * @param options {Object} The options object
 * @param options.topic {String} The URL of the feed to retrieve
 * @param [options.count] {Number} How many entries to retrieve
 * @param [options.before] {ID} The ID of an entry; retrieved entries will be older
 * @param [options.after] {ID} The ID of an entry; retrieved entries will be newer
 * @param [options.hub] {String} The URL of the hub to send the request to
 * @param callback {Function} Callback containing error and result
 */
Pubsub.prototype.retrieveFeed = function (options, callback) {
  var topic = options.topic || false;
  var count = options.count || 10;
  var before = options.before || null;
  var after = options.after || null;
  var feedSecret = false;
  var hub = options.hub || config.pubsub.hub;

  if (!topic) {
    return callback(new Error('No topic specified'));
  };

  var form = {
    'hub.mode': 'retrieve',
    'hub.topic': topic,
    'count': count,
    'before': before,
    'after': after
  };

  if (this.format === 'json' || this.format === 'JSON') {
    form['format'] = 'json';
  };

  // Only attempt retrieval if feed in database
  db.feeds.findOneByTopic(topic, (function (err, feed) {
    if (err) {
      return callback(err);
    };

    if (feed.secret) {
      form['hub.secret'] = feed.secret;
    };

    var postParams = {
      url: hub,
      form: form,
      encoding: 'utf-8',
      timeout: 2000
    };

    if (this.auth) {
      postParams.auth = this.auth;
    };

    // Send request
    var req = request.get(postParams, (function (err, res, body) {
      if (err) return callback(err);

      // 404 response means not subscribed or feed not added
      if (res.statusCode === 404) {
        return callback(new StatusError(404, 'Not subscribed to feed'));
      };

      // 422 has reason for failure in body
      if (res.statusCode === 422) {
        return callback(new StatusError(422, 'Retrieve failed because ' + body));
      };

      // Catch any other responses
      if (res.statusCode != 200) {
        return callback(new StatusError(res.statusCode, http.STATUS_CODES[res.statusCode]));
      };

      // Emit notification event
      this.emit('feed_update', {
        topic: topic,
        hub: hub,
        feed: body,
        headers: res.headers
      });

      return callback(null, count);
    }).bind(this));

    console.log(req.headers);
  }).bind(this));
};

/**
 * An Error containing an HTTP StatusCode
 *
 * @class StatusError
 * @constructor
 */
function StatusError(code, message) {
  this.statusCode = code || 500;
  this.message = message || 'Something went wrong';
};
StatusError.prototype = new Error();
StatusError.prototype.constructor = StatusError;