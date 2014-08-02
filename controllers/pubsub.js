var pubsubController = require('./pubsubController.js');
var db = require('../models/db.js');
var moment = require('moment');
var config = require('../config');
var async = require('async');

var Author = require('../models/author');
var Entry = require('../models/entry');

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
    
    if (json.items) {
      async.waterfall([
        function (callback) {
          var names = getNames(json);
          return callback(null, names);
        },
        function (names, callback) {
          getAuthors(names, function (err, authors) {
            if (err) return callback(err);
            return callback(null, authors);
          });
        } 
      ], function (err, authors) {
        for (var i = json.items.length - 1; i >= 0; i--) {
          var item = json.items[i];

          var author = getAuthorId(authors, item.actor.displayName);
          console.log(author);

          var entry = new Entry();
          entry.title = item.title;
          entry.topic = data.topic;
          entry.published = item.published;
          entry.updated = item.updated;
          entry.content = item.content;
          entry.permalinkUrl = item.permalinkUrl;
          entry.summary = item.summary;
          entry.actor = author;

          entry.save();
        };
      });
    }
  } else {
    console.log('Notification was not in JSON format');
  };
});

var getNames = function (json) {
  var names = [];
  for (var i = json.items.length - 1; i >= 0; i--) {
    if (json.items[i].actor) {
      var actor = json.items[i].actor;
      if (names.indexOf(actor.displayName) === -1) {
        names.push(actor.displayName);
      };
    };
  };
  return names;
};

var getAuthors = function (names, callback) {
  var authors = [];
  async.each(names, function (name, cb) {
    Author.findOne({ displayName: name }, function (err, result) {
      if (err) cb(err);
      if (result) {
        authors.push(result);

        return cb(null);
      } else {
        var author = new Author();
        author.displayName = name;
        author.save();

        authors.push(author);
        return cb(null);
      };
    });
  }, function (err) {
    if (err) return callback(err);
    return callback(null, authors);
  });
};

var getAuthorId = function (authors, name) {
  var match = false;
  for (var i = authors.length - 1; i >= 0; i--) {
    if (authors[i].displayName === name) {
      match = true;
      return authors[i];
    };
  };
  if (!match) {
    var author = new Author();
    author.displayName = name;
    author.save();
    return author;
  };
};

var parseAuthors = function (input) {
  var split = input.split(/[\s,]+/);


  var givenName = split[0];
  var familyName = split[1];

  var author = ({
    displayName: input.displayName,
    givenName: givenName,
    familyName: familyName,
    id: input.id
  });

  return authors;
};
