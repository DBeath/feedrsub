var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
	return new Feeds(db);
};

function Feeds (db) {
	this.collection = new mongodb.Collection(db, 'feeds');
  module.exports.FeedsCollection = this.collection;
};

Feeds.prototype.subscribe = function (topic, callback) {
	this.collection.update({
      topic: topic
    },
    {
      $set:{
        status: 'subscribed',
        subtime: moment().unix()
      }
    }, 
    { 
      upsert: true, 
      w: 1 
    }, 
    function (err) {
      if (err) callback(err);
      callback(null, topic);
  });
};

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
      if (err) callback(err);
      callback(null, result);
  });
};

Feeds.prototype.listAll = function (callback) {
  this.collection.find().toArray(function (err, docs) {
    if (err) callback(err);
    callback(null, docs);
  });
};

Feeds.prototype.listByStatus = function (status, callback) {
  this.collection.find({status: status}).toArray(function (err, docs) {
    if (err) callback(err);
    callback(null, docs);
  });
};

Feeds.prototype.findOneById = function (id, callback) {
  this.collection.findOne({_id: ObjectID.createFromHexString(id)}, function (err, doc) {
    if (err) callback(err);
    callback(null, doc);
  });
};

Feeds.prototype.delete = function (id, callback) {
  this.collection.remove({_id: ObjectID.createFromHexString(id)}, {w:1}, function (err, num) {
    if (err) callback(err);
    callback(null, num);
  });
};

Feeds.prototype.updateStatus = function (status, callback) {
  this.collection.update({
      topic: status.feed
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
        eclsm: status.entriesCountSinceLastMaintenance
      }
    },
    {
      w: 1
    },
    function (err, result) {
      if (err) callback(err);
      callback(null, result);
  });
};