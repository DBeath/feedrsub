var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
	return new Subscriptions(db);
};

function Subscriptions (db) {
	this.collection = new mongodb.Collection(db, 'subscriptions');
};

Subscriptions.prototype.addSubscription = function (topic, callback) {
	this.collection.update({
      topic: data.topic
    },
    {
      topic: data.topic, 
      subtime: moment().format('X'),
      status: 'subscribed'
    }, 
    { upsert: true }, 
    function (err) {
      if (err) console.log(err.message);
  });
};

Subscriptions.prototype.listAll = function (callback) {
  this.collection.find().toArray(function (err, docs) {
    if (err) callback(err);
    callback(null, docs);
  });
};

Subscriptions.prototype.findOne = function (id, callback) {
  this.collection.findOne({_id: ObjectID.createFromHexString(id)}, function (err, doc) {
    if (err) callback(err);
    callback(null, doc);
  });
};

Subscriptions.prototype.delete = function (id, callback) {
  this.collection.remove({_id: ObjectID.createFromHexString(id)}, {w:1}, function (err, num) {
    if (err) callback(err);
    callback(null, num);
  });
};

Subscriptions.prototype.unsubscribe = function (topic, callback) {
  this.collection.update({ topic: topic },{$set:{ status: 'unsubscribed' }}, {w:1}, 
    function (err, result) {
      if (err) callback(err);
      callback(null, result);
  });
};