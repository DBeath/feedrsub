var pubsub = require('./pubsub.js').pubsub;
var io = require('./socket.js').io;
var mongo = require('../models/mongodb.js');
var moment = require('moment');


pubsubController.on('feed_update', function (data) {
  console.log(data);
  var re = new RegExp('application/json');
  if (re.test(data.headers['content-type'])) {
    var json = JSON.parse(data.feed);

    mongo.feeds.updateDetails(json.status, function (err, result) {
      if (err) console.log(err);
    });

    if (json.items) {
      for (var i = 0; i < json.items.length; i++) {
        json.items[i].topic = topic;
        mongo.entries.insert(json.items[i], function (err) {
          if (err) console.log(err);
          else {
            var message = 'Added entry from %s at %s', topic, moment().format();
            console.log('Added entry from %s at %s', topic, moment().format());
            io.emitMessage(message);
        });
      };
    } else {
      console.log('No items in notification');
    };
  } else {
    console.log('Notification was not in JSON format');
  };
});