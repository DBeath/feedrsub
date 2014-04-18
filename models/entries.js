var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
  return new Entries(db);
};

function Entries (db) {
  this.collection = new mongodb.Collection(db, 'entries');
  module.exports.EntriesCollection = this.collection;
};

Entries.prototype.insert = function (item, callback) {
  this.collection.insert(item, {w:1}, function (err) {
    if (err) return callback(err);
    return callback(null);
  }); 
};

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

Entries.prototype.countAll = function (callback) {
  this.collection.count(function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

Entries.prototype.countAllByTopic = function (topic, callback) {
  this.collection.count({
    topic: topic
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

Entries.prototype.countRecent = function (time, callback) {
  this.collection.count({
    published: {$gt: time}
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

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