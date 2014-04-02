var config = require('../config.json');
var mongo = require('../models/mongodb.js');
var request = require('request');
var crypto = require('crypto');
var moment = require('moment');

module.exports.pubsubController = function (options) {
  return new pubsub(options);
};

function pubsub (options) {
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
  this.pending = [];   
};

// Handles verification of intent from hub.
pubsub.prototype.verification = function (req, res) {
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
    case 'unsubscribe':
      var index = pending.indexOf(topic);
      if (index > -1) {
        res.send(200, challenge);
        mongo.feeds.subscribe(topic, function (err, result) {
          if (err) console.log(err);
          console.log('subscribed to %s', topic);
        });
        pending.slice(index);
      } else {
        res.send(404);
      };
      break;
    default:
      res.send(403);    
  };
};

// Called when the hub notifies the subscriber with new data.
pubsub.prototype.notification = function (req, res) {
  var topic = req.query['hub.topic'] || false;
  var hub = req.query['hub'] || false;
  var signatureParts, signature, algo, hmac;

  (req.headers && req.headers.link || '').
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

  if (this.secret && !req.headers['x-hub-signature']) {
    return res.send(403);
  };

  if (this.secret) {
    signatureParts = req.headers['x-hub-signature'].split('=');
    algo = (signatureParts.shift() || '').toLowerCase();
    signature = (signatureParts.pop() || '').toLowerCase();

    try {
      hmac = crypto.createHmac(algo, crypto.createHmac('sha1', this.secret).update(topic).digest('hex'));
    } catch(E) {
      return res.send(403);
    };
  };

  hmac.update(req.body);

  if (this.secret && hmac.digest('hex').toLowerCase() != signature) {
    return res.send(202);
  };

  console.log('Received notification from %s at %s', topic, moment().format());
  res.send(204);

  var re = new RegExp('application/json');
  if (re.test(req.headers['content-type'])) {
    var data = JSON.parse(req.body);

    mongo.feeds.updateDetails(data.status, function (err, result) {
      if (err) console.log(err);
    });

    if (json.items) {
      for (var i = 0; i < json.items.length; i++) {
        json.items[i].topic = topic;
        mongo.entries.insert(json.items[i], function (err) {
          if (err) console.log(err);
          else console.log('Added entry from %s at %s', topic, moment().format());
        });
      };
    } else {
      console.log('No items in notification');
    };
  } else {
    console.log('Notification was not in JSON format');
  };
};

pubsub.prototype.subscribe = function (topic, hub) {
  this._sendSubscription('subscribe', topic, hub, function (err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
};

pubsub.prototype.unsubscribe = function (topic, hub) {
  this._sendSubscription('unsubscribe', topic, hub, function (err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
};

// Sends a subscribe or unsubscribe request to the hub
pubsub.prototype._sendSubscription = function (mode, topic, hub, callback) {
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
      pending.push(topic);
      callback(null, 'Accepted');
    } else {
      callback('Subscription failed', null);
    };
  });
};

pubsub.prototype.test = function (message, cb) {
  console.log(message);
  cb('done');
};