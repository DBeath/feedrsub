var pubsubController = require('./pubsubController.js');
var db = require('../models/mongodb.js');
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
  var re = new RegExp('application/json');
  if (re.test(data.headers['content-type'])) {

    try {
      var json = JSON.parse(data.feed);
    } catch (e) {
      return console.log(e);
    };

    if (json.status) {
      var status = json.status;
      status.title = json.title;
      status.permalinkUrl = json.permalinkUrl;
      status.updated = json.updated;

      db.feeds.updateDetails(data.topic, status, function (err, result) {
        if (err) return console.log(err);
        console.log('Updated status of %s', data.topic);
      });
    };

    if (json.items) {

      json.items.forEach(function (item, index, array) {
        item.topic = data.topic;
        if (!item.published) {
          item.published = moment().unix();
        };
        db.entries.insert(item, function (err) {
          if (err) return console.log(err);
          return console.log('Added entry from %s at %s', data.topic, moment().format());
        });
      });

    } else {
      console.log('No items in notification');
    };
  } else {
    console.log('Notification was not in JSON format');
  };
});