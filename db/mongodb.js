var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var Feeds = require('./feeds.js');
var Entries = require('./entries.js');

module.exports.init = function (callback) {
  var server = new mongodb.Server('localhost', 27017);
  new mongodb.MongoClient(server, {w: 1}).open(function (error, mongoclient) {
  	if (error) callback(error);
    var db = mongoclient.db('feedrsub');
    module.exports.mongoclient = mongoclient;
    module.exports.entries = Entries.createCollection(db);
    module.exports.feeds = Feeds.createCollection(db);
    module.exports.errors = new mongodb.Collection(db, 'errors');
    callback();
  });
};