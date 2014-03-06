var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');

module.exports.init = function (callback) {
	var server = new mongodb.Server('localhost', 27017);
	new mongodb.MongoClient(server, {w: 1}).open(function (error, mongoclient) {
		var db = mongoclient.db('feedrsub');
		module.exports.mongoclient = mongoclient;
		module.exports.feeds = new mongodb.Collection(db, 'feeds');
		module.exports.subscriptions = new mongodb.Collection(db, 'subscriptions');
		callback(error);
	});
};