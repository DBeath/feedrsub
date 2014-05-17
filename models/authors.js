var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
  return new Authors(db);
};

function Authors(db) {
  this.collection = new mongodb.Collection(db, 'authors');
  module.exports.AuthorsCollection = this.collection;
};

Authors.prototype.update = function (id, author, callback) {
  this.collection.update({
    _id: id
  },
  author,
  {
    upsert: true
  }, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

Authors.prototype.listAll = function (callback) {
  this.collection.find().toArray(function (err, docs) {
    if (err) return callback(err);
    return callback(null, docs);
  });
};

Authors.prototype.count = function (callback) {
  this.collection.count({}, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

Authors.prototype.findOneById = function (id, callback) {
  this.collection.findOne({_id: ObjectID.createFromHexString(id)}, function (err, doc) {
    if (err) return callback(err);
    return callback(null, doc);
  });
};

Authors.prototype.findOne = function (id, callback) {
  this.collection.findOne({id: id}, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};