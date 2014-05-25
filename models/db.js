var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var Feeds = require('./feeds.js');
var Entries = require('./entries.js');
var Authors = require('./authors.js');
var config = require('../config/');

var mongoclient;

module.exports.init = function (callback) {
  var connString = config.express.connstring || "mongodb://localhost:27017/feedrsub";
  mongoclient = new MongoClient();

  mongoclient.connect(connString, function (err, database) {
    if (err) return callback(err);
    var db = database;

    module.exports.entries = Entries.createCollection(db);
    module.exports.feeds = Feeds.createCollection(db);
    module.exports.authors = Authors.createCollection(db);
    module.exports.errors = new mongodb.Collection(db, 'errors');
    module.exports.database = db;
    var message = 'Connected to ' + connString;
    return callback(null, message);
  });
};

module.exports.close = function (callback) {
  mongoclient.close(function (err) {
    if (err) return callback(err);
    return callback();
  });
};