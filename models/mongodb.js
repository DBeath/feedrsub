var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var Feeds = require('./feeds.js');
var Entries = require('./entries.js');
var config = require('../config.json');

module.exports.init = function (callback) {
  var connString = config.connString || "mongodb://localhost:27017/feedrsub";

  MongoClient.connect(connString, function (err, database) {
    if (err) callback(err);
    var db = database;

    module.exports.entries = Entries.createCollection(db);
    module.exports.feeds = Feeds.createCollection(db);
    module.exports.errors = new mongodb.Collection(db, 'errors');
    var message = 'Connected to ' + connString;
    callback(null, message);
  });
};