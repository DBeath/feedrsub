var config = require('../config');
var StatusError = require('../lib/errors.js').StatusError;
var RSS = require('rss');
var async = require('async');
var validator = require('validator');
var moment = require('moment');

var User = require('../models/user');
var Entry = require('../models/entry');
var Subscription = require('../models/subscription');

module.exports.UsersController = function () {
  return new Users();
};

function Users () {};

Users.prototype.rss = function (req, res, next) {

}