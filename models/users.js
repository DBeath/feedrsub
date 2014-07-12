var moment = require('moment');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var bcrypt = require('bcrypt-nodejs');

module.exports.createCollection = function (db) {
  return new Users(db);
};

function Users(db) {
  this.collection = new mongodb.Collection(db, 'users');
  module.exports.UsersCollection = this.collection;
};

Users.prototype.findOne = function (email, callback) {
  this.collection.findOne({email: email}, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

Users.prototype.findOneById = function (id, callback) {
  this.collection.findOne({_id: ObjectID.createFromHexString(id)}, function (err, result) {
    if (err) return callback(err);
    return callback(null, result);
  });
};

Users.prototype.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

Users.prototype.validPassword = function(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword);
};

Users.prototype.newUserLocal = function (email, password, callback) {
  this.collection.findOne({email: email}, function (err, result) {
    if (err) return callback(err);
    if (result) {
      return callback(null, false);
    } else {
       this.collection.insert({
        email: email,
        password: this.generateHash(password),
        role: 'user'
      }, function (err, result) {
        if (err) return callback(err);
        return callback(null);
      })
    }
  })
};

Users.prototype.create = function (email, password, role, callback) {
  this.collection.insert({
    email: email,
    password: this.generateHash(password),
    added: Date.now(),
    role: role
  },
  {w: 1},
  function (err, result) {
    if (err) return callback(err);
    return callback(null, result[0]);
  });
};