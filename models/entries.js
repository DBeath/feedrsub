var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

/**
 * Provides an entries collection
 *
 * @module Entries
 */
module.exports.createCollection = function (db) {
  return new Entries(db);
};

/**
 * Controls access to the entries collection
 *
 * @class Entries
 * @constructor
 * @param db {Object} A database object
 */
function Entries (db) {
  this.collection = new mongodb.Collection(db, 'entries');
  this.collection.ensureIndex('topic', function (err, result) {
    if (err) return console.log(err);
    //console.log('Index %s exists for Entries collection', result);
    return;
  });
  module.exports.EntriesCollection = this.collection;
};

/**
 * Inserts a single entry
 *
 * @method insert
 * @param item {Object} The entry to be inserted, in JSON format
 * @param callback {Function} Callback containing error
 */
Entries.prototype.insert = function (item, callback) {
  this.collection.insert(item, {w:1}, function (err) {
    if (err) return callback(err);
    return callback(null);
  }); 
};

/**
 * Updates or creates an entry by id
 *
 * @method update
 * @param id {ID} The id of the entry (unique from the mongodb Object Id)
 * @param doc {Object} Object containing updates to the entry, in JSON format
 * @param callback {Function} Callback containing error or result
 */
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

/**
 * Returns a list of entries for a feed
 *
 * @method list
 * @param topic {String} The URL of the feed to retrieve entries for
 * @param limit {Number} How many entries to return
 * @param callback {Function} Callback containing error or array of entries
 */
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

/**
 * Returns a count of the total number of entries in the database
 *
 * @method countAll
 * @param callback {Function} Callback containing error or result
 */
Entries.prototype.countAll = function (callback) {
  this.collection.count(function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Returns a count of the total number of entries for a given feed
 *
 * @method countAllByTopic
 * @param topic {String} The URL of the feed to count entries for
 * @param callback {Function} Callback containing error or result
 */
Entries.prototype.countAllByTopic = function (topic, callback) {
  this.collection.count({
    topic: topic
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Returns a count of the total number of entries published more recently than the given time
 *
 * @method countRecent
 * @param time {Number} The Unix date to count entries newer than
 * @param callback {Function} Callback containing error or result
 */
Entries.prototype.countRecent = function (time, callback) {
  this.collection.count({
    published: {$gt: time}
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Returns a count of the total number of entries for a given feed which were published more 
 * recently than the given time
 *
 * @method countRecentByTopic
 * @param topic {String} The URL of the feed
 * @param time {Number} The Unix date to count entries newer than
 * @param callback {Function} Callback containing error or result
 */
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