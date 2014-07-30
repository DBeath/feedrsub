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

    // If data contains items add them to database.
    // if (json.items) {

    //   json.items.forEach(function (item, index, array) {
    //     // Associate item with feed.
    //     item.topic = data.topic;

    //     // Item must have published date.
    //     if (!item.published) {
    //       item.published = moment().unix();
    //     };

    //     // Item must have unique Id (seperate from database id).
    //     if (!item.id) {
    //       item.id = item.permalinkUrl || data.topic+'/'+item.title+'/'+item.published;
    //     };

    //     if (item.actor) {
    //       var author = new Author();
    //       author.displayName = item.actor;

    //       getAuthorId(author, function (err, id) {
    //         if (err) console.error(err);
    //         if (id) {
    //           item.actor.id = id;
    //         };
    //         addEntry();
    //       });
    //     } else {
    //       addEntry();
    //     };
       
    //     function addEntry() {
    //       // Adds entry item if Id doesn't exist, update entry item if it does.
    //       db.entries.update(item.id, item, function (err) {
    //         if (err) return console.error(err);
    //         return console.log('Added entry from %s at %s', data.topic, moment().format());
    //       });
    //     };
    //   });
    // } else {
    //   console.log('No items in notification');
    // };

    
    if (json.items) {
      var names = getNames(json);
      console.log('Names ' + names);
      var authors = getAuthors(names);
      console.log('Authors ' + authors);

      for (var i = json.items.length - 1; i >= 0; i--) {
        var item = json.items[i];

        console.log('Authors 2 ' + authors);
        var author = getAuthorId(authors, item.actor.displayName);

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
      console.log(actor);
      if (names.indexOf(actor.displayName) === -1) {
        names.push(actor.displayName);
      };
    };
  };
  return names;
};

var getAuthors = function (names) {
  var authors = [];
  async.each(names, function (name, callback) {
    console.log('Async name ' + name);
    Author.findOne({ displayName: name }, function (err, result) {
      if (err) callback(err);
      if (result) {
        authors.push(result);
        console.log('Found author ' + result);
        callback(null);
      } else {
        var author = new Author();
        author.displayName = name;
        author.save();
        console.log('Created author ' + author);

        authors.push(author);
        callback(null);
      };
    });
  }, function (err) {
    if (err) throw err;
    return authors;
  });
};

var getAuthorId = function (authors, name) {
  console.log(authors);
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

// var getAuthorId = function (author, callback) {
//   Author.findOne({ displayName: author.displayName }, function (err, result) {
//     if (err) return callback(err);
//     if (result) {
//       return callback(null, result._id);
//     } else {
//       Author.findOneAndUpdate(
//         { displayName: author.displayName }, 
//         author,
//         { upsert: true }, 
//         function (err, result) {
//           if (err) return callback(err);
//           return callback(null, result._id);
//       });
//     };
//   });
// };

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
