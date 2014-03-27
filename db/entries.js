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
    if (err) callback(err);
    console.log(moment().format()+' | Inserted entry');
  }); 
};

Entries.prototype.list = function (topic, limit, callback) {
  this.collection.find({topic: topic}).limit(limit).toArray(function (err, docs) {
    if (err) callback(err);
    callback(null, docs);
  });
};