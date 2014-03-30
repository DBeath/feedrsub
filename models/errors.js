var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

module.exports.createCollection = function (db) {
	return new Errors(db);
};

function Errors (db) {
	this.collection = new mongodb.collection(db, 'errors');
	module.exports.ErrorsCollection = this.collection;
};