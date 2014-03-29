var pubSubHubbub = require('pubsubhubbub');
var crypto = require('crypto');
var fs = require('fs');
var config = require('./config.json');
var mongo = require('./db/mongodb.js');
var moment = require('moment');

var pubsub = pubSubHubbub.createServer({
  callbackUrl: config.pubsub.callbackurl,
  secret: config.pubsub.secret,
  username: config.pubsub.username,
  password: config.pubsub.password,
  format: config.pubsub.format
});

module.exports.pubsub = pubsub;

pubsub.on('denied', function (data) {
  console.log("Denied");
  console.log(data);
});

pubsub.on('subscribe', function (data) {
  mongo.feeds.subscribe(data.topic, function (err, result) {
    if (err) console.log(err);
    else console.log("Subscribed "+data.topic+" at "+ moment().format());
  });
});

pubsub.on('unsubscribe', function (data) { 
  mongo.feeds.unsubscribe(data.topic, function (err, result) {
    if (err) console.log(err);
    else console.log("Unsubscribed "+data.topic+" at "+moment().format());
  });
});

pubsub.on('error', function (error) {
  console.log('Error: '+error);
  var err = null;
  if(error.code){
    err = {'code': error.code, 'message': error.message};
  } else {
    err = {'code': 500, 'message': error.message};
  }
  mongo.errors.insert(err, {w:1}, function (err) {
    if (err) console.log(err.message);
    else console.log('Logged error');
  });
});

pubsub.on('listen', function () {
  console.log("Pubsub server listening on port %s", pubsub.port);
});

pubsub.on('feed', function (data) {
  console.log('Received notification from %s at %s', data.topic, moment().format());

  var re = new RegExp('application/json');
  if (re.test(data.headers['content-type'])) {

    var json = JSON.parse(data.feed);

    mongo.feeds.updateStatus(json.status, function (err, result) {
      if (err) console.log(err);
    });

    if (json.items) {
      for (var i = 0; i < json.items.length; i++) {
        json.items[i].topic = data.headers['X-PubSubHubbub-Topic'];
        mongo.entries.insert(json.items[i], function (err) {
          if (err) console.log(err);
          else console.log(moment().format()+' | Inserted entry');
        });  
      };   
    } else {
      console.log('No items in notification');
    };  
  } else {
    console.log('Notification was not JSON');
  };  
});
