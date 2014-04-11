var pubsubController = require('./pubsubController.js');
var io = require('./socket.js').io;
var mongo = require('../models/mongodb.js');
var moment = require('moment');
var config = require('../config.json');

var pubsub = pubsubController.createController({
  secret: config.pubsub.secret,
  domain: config.pubsub.domain,
  format: config.pubsub.format,
  username: config.pubsub.username,
  password: config.pubsub.password
});

module.exports.pubsub = pubsub;

pubsub.on('feed_update', function (data) {
  //console.log(data);
  var re = new RegExp('application/json');
  if (re.test(data.headers['content-type'])) {

    try {
      var json = JSON.parse(data.feed);
    } catch (e) {
      return console.log(e);
    };

    if (json.status) {
      mongo.feeds.updateDetails(json.status, function (err, result) {
        if (err) console.log(err);
      });
    };

    if (json.items) {
      for (var i = 0; i < json.items.length; i++) {
        json.items[i].topic = topic;
        mongo.entries.insert(json.items[i], function (err) {
          if (err) console.log(err);
          else {
            console.log('Added entry from %s at %s', topic, moment().format());
            //io.emitMessage(message);
          };
        });
      };
    } else {
      console.log('No items in notification');
    };
  } else {
    console.log('Notification was not in JSON format');
  };
});