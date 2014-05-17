var pubsubController = require('./pubsubController.js');
var db = require('../models/db.js');
var moment = require('moment');
var config = require('../config.json');

//Creates Pubsub object.
var pubsub = pubsubController.createController({
  secret: config.pubsub.secret,
  domain: config.pubsub.domain,
  format: config.pubsub.format,
  username: config.pubsub.username,
  password: config.pubsub.password,
  retrieve: config.pubsub.retrieve,
  verify: config.pubsub.verify
});

module.exports.pubsub = pubsub;

// Adds notifications to database and updates feed details.
pubsub.on('feed_update', function (data) {
  var re = new RegExp('application/json');

  // Data must currently be in JSON format.
  if (re.test(data.headers['content-type'])) {

    try {
      var json = JSON.parse(data.feed);
    } catch (err) {
      return console.error(err);
    };

    // If data contains feed status update then update feed.
    if (json.status) {
      var status = json.status;
      status.title = json.title;
      status.permalinkUrl = json.permalinkUrl;
      status.updated = json.updated;

      db.feeds.updateDetails(data.topic, status, function (err, result) {
        if (err) return console.error(err);
        console.log('Updated status of %s', data.topic);
      });
    };

    // If data contains items add them to database.
    if (json.items) {

      json.items.forEach(function (item, index, array) {
        // Associate item with feed.
        item.topic = data.topic;

        // Item must have published date.
        if (!item.published) {
          item.published = moment().unix();
        };

        // Item must have unique Id (seperate from database id).
        if (!item.id) {
          item.id = item.permalinkUrl || data.topic+'/'+item.title+'/'+item.published;
        };

        // Adds entry item if Id doesn't exist, update entry item if it does.
        db.entries.update(item.id, item, function (err) {
          if (err) return console.error(err);
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