var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
  return new Feeds(db);
};

function Feeds (db) {
  this.collection = new mongodb.Collection(db, 'feeds');
  module.exports.feedsCollection = this.collection;
};

Feeds.prototype.insert = function (item, callback) {
  this.collection.insert(item, {w:1}, function (err) {
    if (err) callback(err);
    console.log(moment().format()+' | Inserted feed item');
  }); 
};

Feeds.prototype.list = function (topic, limit, callback) {
  this.collection.find({topic: topic}).limit(limit).toArray(function (err, docs) {
    if (err) callback(err);
    callback(null, docs);
  });
};