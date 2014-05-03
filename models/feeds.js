var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
  return new Feeds(db);
};

// The Feeds object. Creates or opens a collection called 'feeds'.
function Feeds (db) {
  this.collection = new mongodb.Collection(db, 'feeds');
  this.collection.ensureIndex('topic', function (err, result) {
    if (err) return console.log(err);
    return console.log('Index %s exists for Feeds collection', result);
  });
  module.exports.FeedsCollection = this.collection;
};

// Sets a feed as 'subscribed' and adds the given secret.
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

// Sets a feed as 'unsubscribed'.
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

// Returns a list of all feeds.
Feeds.prototype.listAll = function (callback) {
  this.collection.find().toArray(function (err, docs) {
    if (err) return callback(err);
    return callback(null, docs);
  });
};

// Returns a list of feeds by status.
Feeds.prototype.listByStatus = function (status, callback) {
  this.collection.find({status: status}).sort([['title', 1]]).toArray(function (err, docs) {
    if (err) return callback(err);
    return callback(null, docs);
  });
};

// Returns a feed given a MongoDB Object Id.
Feeds.prototype.findOneById = function (id, callback) {
  this.collection.findOne({_id: ObjectID.createFromHexString(id)}, function (err, doc) {
    if (err) return callback(err);
    return callback(null, doc);
  });
};

// Returns a feed given a topic.
Feeds.prototype.findOneByTopic = function (topic, callback) {
  this.collection.findOne({topic: topic}, function (err, doc) {
    if (err) return callback(err);
    return callback(null, doc);
  });
};

// Deletes a feed given a MongoDB Object Id.
Feeds.prototype.delete = function (id, callback) {
  this.collection.remove({_id: ObjectID.createFromHexString(id)}, {w:1}, function (err, num) {
    if (err) return callback(err);
    return callback(null, num);
  });
};

// Updates the details of a feed given a Superfeedr feed status.
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

// Updates the time until the feed lease runs out.
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

// Updates the subscription status of a feed.
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

// Updates the subscription status of a feed given a MongoDB Object Id.
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

// Returns a count of all feeds.
Feeds.prototype.countAll = function (callback) {
  this.collection.count(function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

// Returns a count of feeds by status.
Feeds.prototype.countByStatus = function (status, callback) {
  this.collection.count({
    status: status
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

// Returns a count of feeds subscribed to more recently than the given time.
Feeds.prototype.countRecent = function (time, callback) {
  this.collection.count({
    subtime: {$gt: time}
  },
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};