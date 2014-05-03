var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
  return new Entries(db);
};

// The Entries object. Create or opens a collection called 'entries'.
function Entries (db) {
  this.collection = new mongodb.Collection(db, 'entries');
  this.collection.ensureIndex('topic', function (err, result) {
    if (err) return console.log(err);
    return console.log('Index %s exists for Entries collection', result);
  });
  module.exports.EntriesCollection = this.collection;
};

// Inserts a single entry
Entries.prototype.insert = function (item, callback) {
  this.collection.insert(item, {w:1}, function (err) {
    if (err) return callback(err);
    return callback(null);
  }); 
};

// Updates an entry selected by the id, or creates it if not found
// The id is created by Superfeedr, or if not sent then 
// is created by topic + title + published date.
// This id is separate from MongoDB's object _id.
Entries.prototype.update = function (id, doc, callback) {
  this.collection.update({
    id: id
  },
  doc,
  {
    upsert:true,
    w: 1
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

// Returns a list of entries for a topic, with a limit to number of entries returned.
Entries.prototype.list = function (topic, limit, callback) {
  this.collection.find({topic: topic})
    .limit(limit)
    .sort([['published', -1]])
    .toArray(
      function (err, docs) {
        if (err) return callback(err);
        return callback(null, docs);
  });
};

// Returns a count of the total number of entries in the database.
Entries.prototype.countAll = function (callback) {
  this.collection.count(function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

// Returns a count of the total number of entries for a given topic.
Entries.prototype.countAllByTopic = function (topic, callback) {
  this.collection.count({
    topic: topic
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

// Returns a count of the total number of entries published more recently than the given time.
Entries.prototype.countRecent = function (time, callback) {
  this.collection.count({
    published: {$gt: time}
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

// Returns a count of the number of entries for a given topic which were published more 
// recently than the given time.
Entries.prototype.countRecentByTopic = function (topic, time, callback) {
  this.collection.count({
    topic: topic,
    published: {$gt: time}
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};