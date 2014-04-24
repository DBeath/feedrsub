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
  this.retrieve = options.retrieve || false;

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

  var bodyChunks = [];
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

  if (this.retrieve && mode === 'subscribe') {
    form['retrieve'] = 'true';
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

    var req = request.post(postParams);

    req.on('error', function (err) {
      return callback(err);
    });

    req.on('data', function (chunk) {
      if (!chunk) {
        return;
      };

      bodyChunks.push(chunk);
    });

    req.on('end', function () {
      // Subscription was successful
      if (res.statusCode === 202 || res.statusCode === 204 || res.statusCode === 200) {
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
        // Subscription contains feed body
        if (res.statusCode === 200) {
          // Emit notification event.
          this.emit('feed_update', {
            topic: topic,
            hub: hub,
            feed: Buffer.concat(bodyChunks),
            headers: res.headers
          });
        };
      // Subscription failed, reason in body
      } else if (res.statusCode === 422) {
        return callback('Subscription failed: %s', Buffer.concat(bodyChunks));
      // Subscription failed with other code
      } else {
        return callback('Subscription failed with code %s', res.statusCode);
      };
    });

    // // Send request
    // request.post(postParams, function (err, response, body) {
    //   if (err) return callback(err);

    //   // If successful then move feed out of 'pending' status and update subtime/unsubtime.
    //   if (response.statusCode === 202 || response.statusCode === 204) {
    //     switch ( mode ) {
    //       case 'subscribe':
    //         db.feeds.subscribe(topic, feedSecret, function (err, result) {
    //           if (err) return callback(err);
    //           return callback(null, 'Subscribed');
    //         });
    //         break;
    //       case 'unsubscribe':
    //         db.feeds.unsubscribe(topic, function (err, result) {
    //           if (err) return callback(err);
    //           return callback(null, 'Unsubscribed');
    //         });
    //         break;
    //     }; 
    //   } else {
    //     var message = 'Subscription failed because: ' + body;
    //     return callback(message);
    //   };
    // });
  }).bind(this));
};

// Retreive entries from a feed. 
// 
// options.topic {url} (required): the feed url.
// options.count {int} (optional): how many entries to retrieve.
// options.before {id} (optional): only retrieve entries published before this one.
// options.after {id} (optional): only retrieve entries published after this one.
// options.hub {url} (optional): the hub to retrieve the entries from.
Pubsub.prototype.retrieve = function (options, callback) {
  var topic = options.topic || false;
  var count = options.count || 10;
  var before = options.before || null;
  var after = options.after || null;
  var feedSecret = false;
  var hub = options.hub || config.pubsub.hub;
  var bodyChunks = [];

  if (!topic) {
    return callback('No topic specified');
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

  // Only attempt retrieval if subscribed to feed.
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
      encoding: 'utf-8'
    };

    if (this.auth) {
      postParams.auth = this.auth;
    };

    var req = request.post(postParams);

    req.on('error', function (err) {
      return callback(err);
    });

    req.on('data', function (chunk) {
      if (!chunk) {
        return;
      };

      bodyChunks.push(chunk);
    });

    req.on('end', (function () {
      // 404 response means not subscribed or feed not added.
      if (res.statusCode === 404) {
        return callback('404 - Not subscribed to feed');
      };

      // 422 has reason for failure in body.
      if (res.statusCode === 422) {
        return callback(Buffer.concat(bodyChunks));
      };

      // Catch any other responses.
      if (res.statusCode != 200) {
        return callback('Error - Did not receive 202');
      };

      // Emit notification event.
      this.emit('feed_update', {
        topic: topic,
        hub: hub,
        feed: Buffer.concat(bodyChunks),
        headers: res.headers
      });
    }).bind(this));

  }).bind(this));
}