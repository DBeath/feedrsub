var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');

// module.exports.createDb = function () {
// 	return new feedDb;
// }

// function feedDb(){
// 	MongoClient.connect('mongodb://localhost:27017/test', function (err, db) {
// 		if (err) throw err;
// 		console.log('connected to mongodb');
// 		var feedCollection = db.collection('feeds');
// 	});
// };

// feedDb.prototype.saveFeed = function (data, callback) {
// 	feedCollection.insert(data, function (err, objects) {
// 		if (err) console.warn(err.message);
// 	});
// };

// module.exports.feedDb = feedDb;

// module.exports.init = function (callback) {
// 	var 
// }

module.exports.init = function (callback) {
	var server = new mongodb.Server('localhost', 27017);
	new mongodb.Db('feedrsub', server, {w: 1}).open(function (error, client) {
		module.exports.client = client;
		module.exports.feeds = new mongodb.Collection(client, 'feeds');
		module.exports.subscriptions = new mongodb.Collection(client, 'subscriptions');
		callback(error);
	});
};

// Database = module.exports = function (callback) {
// 	var server = new mongodb.Server('localhost', 27017);
// 	this.db = null;
// 	this.test = '';
// 	new mongodb.Db('test', server, {w: 1}).open(function (error, client) {
// 		myCollection = new mongodb.Collection(client, 'myCollection');
// 		this.db = client;
// 		this.test = 'new test';
// 		console.log('new connection');
// 		callback(error);
// 	});
// };

// Database.prototype.addItem = function (collection, item) {
// 	collection.insert(item);
// };

// Database.prototype.newCollection = function (name) {
// 	var collection = new mongodb.collection(this.db, name);
// 	return collection;
// };