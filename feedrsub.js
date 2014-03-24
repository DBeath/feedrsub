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
module.exports.pubsubinit = function (callback) {
  mongo.init(function (error) {
    if (error) console.log(error);
    pubsub.listen(config.pubsub.listen.port);
  });
  callback();
};

pubsub.on('denied', function (data) {
  console.log("Denied");
  console.log(data);
});

pubsub.on('subscribe', function (data) {
  mongo.subscriptions.subscribe(data.topic, function (err, result) {
    if (err) console.log(err);
    else console.log("Subscribed "+data.topic+" to "+data.hub+" at "+ moment().format());
  });
});

pubsub.on('unsubscribe', function (data) { 
  mongo.subscriptions.unsubscribe(data.topic, function (err, result) {
    if (err) console.log(err);
    else console.log("Unsubscribed "+data.topic+" from "+data.hub);
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
  console.log('Received notification at %s', moment().format());
  if (data.headers['content-type'] === 'application/json') {

    var json = JSON.parse(data.feed);

    mongo.subscriptions.update(json.status, function (err, result) {
      if (err) console.log(err);
    });

    if (json.items) {
      for (var i = 0; i < json.items.length; i++) {

        mongo.feeds.insert(json.items[i], function (err) {
          if (err) console.log(err);
          else console.log(moment().format()+' | Inserted feed item');
        });  
      };   
    } else {
      console.log('No items in notification');
    };  
  } else {
    console.log('Notification was not JSON');
  };  
});
