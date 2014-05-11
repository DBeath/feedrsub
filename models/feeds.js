var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

/**
 * Provides an feeds collection
 *
 * @module Feeds
 */
module.exports.createCollection = function (db) {
  return new Feeds(db);
};

/**
 * Controls access to the feeds collection
 *
 * @class Feeds
 * @constructor
 * @param db {Object} A database object
 */
function Feeds (db) {
  this.collection = new mongodb.Collection(db, 'feeds');
  this.collection.ensureIndex('topic', function (err, result) {
    if (err) return console.log(err);
    //console.log('Index %s exists for Feeds collection', result);
    return;
  });
  module.exports.FeedsCollection = this.collection;
};

/**
 * Sets a feed as 'subscribed' and adds the given secret
 *
 * @method subscribe
 * @param topic {String} The URL of the feed
 * @param secret {String} Secret for calculating HMAC signatures
 * @param callback {Function} Callback containing error or result
 */
Feeds.prototype.subscribe = function (topic, secret, callback) {
  this.collection.update({
      topic: topic
    },
    {
      $set:{
        status: 'subscribed',
        subtime: moment().unix(),
        secret: secret
      }
    }, 
    { 
      upsert: true, 
      w: 1 
    }, 
    function (err) {
      if (err) return callback(err);
      return callback(null, topic);
  });
};

/**
 * Sets a feed as 'unsubscribed'
 *
 * @method unsubscribe
 * @param topic {String} The URL of the feed
 * @param callback {Function} Callback containing error or result
 */
Feeds.prototype.unsubscribe = function (topic, callback) {
  this.collection.update({ 
      topic: topic
    },
    {
      $set: { 
        status: 'unsubscribed', 
        unsubtime: moment().unix()
      }
    }, 
    {
      w: 1
    }, 
    function (err, result) {
      if (err) return callback(err);
      return callback(null, result);
  });
};

/**
 * Returns a list of all feeds
 *
 * @method listAll
 * @param callback {Function} Callback containing error or array of feeds
 */
Feeds.prototype.listAll = function (callback) {
  this.collection.find().toArray(function (err, docs) {
    if (err) return callback(err);
    return callback(null, docs);
  });
};

/**
 * Returns a list of feeds by status
 *
 * @method listByStatus
 * @param status {String} The status to list feeds by
 * @param callback {Function} Callback containing error or array of feeds
 */
Feeds.prototype.listByStatus = function (status, callback) {
  this.collection.find({status: status}).sort([['title', 1]]).toArray(function (err, docs) {
    if (err) return callback(err);
    return callback(null, docs);
  });
};

/**
 * Returns a feed given a MongoDB Object Id
 *
 * @method findOneById
 * @param id {ID} A MongoDB Object Id
 * @param callback {Function} Callback containing error or feed
 */
Feeds.prototype.findOneById = function (id, callback) {
  this.collection.findOne({_id: ObjectID.createFromHexString(id)}, function (err, doc) {
    if (err) return callback(err);
    return callback(null, doc);
  });
};

/**
 * Returns a feed given a topic
 *
 * @method findOneByTopic
 * @param topic {String} The URL of the feed
 * @param callback {Function} Callback containing error or feed
 */
Feeds.prototype.findOneByTopic = function (topic, callback) {
  this.collection.findOne({topic: topic}, function (err, doc) {
    if (err) return callback(err);
    return callback(null, doc);
  });
};

/**
 * Deletes a feed given a MongoDB Object Id
 *
 * @method delete
 * @param id {ID} A MongoDB Object Id
 * @param callback {Function} Callback containing 
 */
// .
Feeds.prototype.delete = function (id, callback) {
  this.collection.remove({_id: ObjectID.createFromHexString(id)}, {w:1}, function (err, num) {
    if (err) return callback(err);
    return callback(null, num);
  });
};

/**
 * Updates the details of a feed given a Superfeedr feed status
 *
 * @method updateDetails
 * @param topic {String} The URL of the feed
 * @param status {Object} The updated status
 * @param callback {Function} Callback containing error or result
 */
Feeds.prototype.updateDetails = function (topic, status, callback) {
  this.collection.update({
      topic: topic
    },
    {
      $set: {
        title: status.title,
        period: status.period,
        lastMaintenanceAt: status.lastMaintenanceAt,
        lastFetch: status.lastFetch,
        code: status.code,
        nextFetch: status.nextFetch,
        http: status.http,
        eclsm: status.entriesCountSinceLastMaintenance,
        permalinkUrl: status.permalinkUrl,
        updated: status.updated
      }
    },
    {
      w: 1
    },
    function (err, result) {
      if (err) return callback(err);
      return callback(null, result);
  });
};

/**
 * Updates the time until the feed lease runs out
 *
 * @method updateLeaseSeconds
 * @param topic {String} The URL of the feed
 * @param seconds {Number} The number of seconds until the feed lease runs out
 * @param callback {Function} Callback containing error or result
 */
Feeds.prototype.updateLeaseSeconds = function (topic, seconds, callback) {
  this.collection.update({
    topic: topic
  },
  {
    $set: {
      leaseSeconds: seconds
    }
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Updates the subscription status of a feed
 *
 * @method updateStatus
 * @param topic {String} The URL of the feed
 * @param status {String} The new status of the feed ('subscribed', 'unsubscribed', 'pending')
 * @param callback {Function} Callback containing error or result
 */
Feeds.prototype.updateStatus = function (topic, status, callback) {
  this.collection.findAndModify({
    topic: topic
  },
  [[topic,'asc']],
  {
    $set: {
      status: status
    }
  },
  {
    upsert: true,
    new: true
  },
  function (err, doc) {
    if (err) return callback(err);
    return callback(null, doc);
  });
};

/**
 * Updates the subscription status of a feed given a MongoDB Object Id
 *
 * @method updateStatusById
 * @param id {ID} The MongoDB Object Id
 * @param status {String} The new status of the feed
 * @param callback {Function} Callback containing error or result
 */
Feeds.prototype.updateStatusById = function (id, status, callback) {
  this.collection.findAndModify({
    _id: ObjectID.createFromHexString(id)
  },
  [['_id', 'asc']],
  {
    $set: {
      status: status
    }
  },
  {
    new: true
  },
  function (err, doc) {
    if (err) return callback(err);
    return callback(null, doc);
  });
};

/**
 * Returns a count of all feeds
 *
 * @method countAll
 * @param callback {Function} Callback containing error or count
 */
Feeds.prototype.countAll = function (callback) {
  this.collection.count(function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Returns a count of feeds by status
 *
 * @method countByStatus
 * @param status {String} The status to return the count for
 * @param callback {Function} Callback containing error or count
 */
Feeds.prototype.countByStatus = function (status, callback) {
  this.collection.count({
    status: status
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Returns a count of feeds subscribed to more recently than the given time
 *
 * @method countRecent
 * @param time {Number} Unix date to count feeds newer than
 * @param callback {Function} Callback containing error or count
 */
Feeds.prototype.countRecent = function (time, callback) {
  this.collection.count({
    subtime: {$gt: time}
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

/**
 * Verifies that a feed is pending subscription/unsubscription
 *
 * @method verifyRequest
 * @param topic {String} The URL of the feed
 * @param callback {Function} Callback containing error, or true if pending, false if not
 */
Feeds.prototype.verifyRequest = function (topic, callback) {
  this.collection.findOne({topic: topic}, function (err, doc) {
    if (err) return callback(err);
    if (doc.status === 'pending') {
      return callback(null, true);
    } else {
      return callback(null, false);
    };
  });
};