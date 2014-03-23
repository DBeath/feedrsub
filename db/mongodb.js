var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var Subscriptions = require('./subscriptions_db.js');

module.exports.init = function (callback) {
  var server = new mongodb.Server('localhost', 27017);
  new mongodb.MongoClient(server, {w: 1}).open(function (error, mongoclient) {
  	if (error) callback(error);
    var db = mongoclient.db('feedrsub');
    module.exports.mongoclient = mongoclient;
    module.exports.feeds = new mongodb.Collection(db, 'feeds');
    module.exports.subscriptions = Subscriptions.createCollection(db);
    module.exports.errors = new mongodb.Collection(db, 'errors');
    callback();
  });
};