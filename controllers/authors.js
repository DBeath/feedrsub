var db = require('../models/db.js');
var config = require('../config');
var StatusError = require('../lib/errors.js').StatusError;

module.exports.AuthorsController = function () {
  return new Authors();
};

function Authors () {};

Authors.prototype.list = function (req, res) {
  db.authors.listAll(function (err, result) {
    if (err) return next(err);
    return res.send(200, result);
  });
};

Authors.prototype.authorEntries = function (req, res) {
  if (!req.param('author')) {
    return next(new StatusError(400, 'Author is not specified'));
  };

  db.authors.findOne(req.param('author'), function (err, author) {
    if (err) return next(err);
    db.entries.listByAuthor(author._id, 10, function (err, entries) {
      if (err) return next(err);
      res.send(200, entries);
    });
  });
};