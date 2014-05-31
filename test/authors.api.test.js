var expect = require('chai').expect;
var request = require('request');
var server = require('../server.js');
var qs = require('querystring');
var db = require('../models/db.js');
var async = require('async');

var authors = [
  {
    displayName: 'John Doe',
    id: 'John Doe'
  },
  {
    displayName: 'Jane Doe',
    id: 'Jane Doe'
  }
];

describe('authors', function () {
  before(function (done) {
    server.start(function () {
      db.authors.collection.remove({}, function (err) {
        if (err) throw err;
        async.each(authors, function (author, callback) {
          db.authors.collection.insert(author, function (err) {
            if (err) return callback(err);
            db.authors.collection.findOne({displayName: author.displayName}, function (err, result) {
              if (err) return callback(err);
              db.entries.collection.insert({
                title: 'TestTitle',
                actor: {
                  displayName: result.displayName,
                  id: result._id 
                }
              }, function (err) {
                if (err) return callback(err);
                return callback();
              });
            });
          });
        }, function (err) {
          if (err) throw err;
          done();
        });
      }); 
    });
  });

  after(function (done) {
    server.close(function () {
      // db.entries.collection.remove({}, function (err) {
      //   if (err) throw err;
      // });
      // db.authors.collection.remove({}, function (err) {
      //   if (err) throw err;
      // });
      done();
    });
  });

  it('should return authors', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/authors',
      auth: {
        user: 'admin',
        pass: 'password'
      }
    };

    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(200);
      var result = JSON.parse(body);
      console.log(result);
      expect(result.length).to.equal(2);
      expect(result[0].displayName).to.equal('John Doe');
      done();
    });
  });

  it('should return entries for an author', function (done) {
    var url = 'http://localhost:4000/api/v1/author/?' + qs.stringify({author: 'John Doe'}); 
    var postParams = {
      url: url,
      auth: {
        user: 'admin',
        pass: 'password'
      }
    };

    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(200);
      var result = JSON.parse(body);
      console.log(result);
      expect(result.length).to.equal(1);
      expect(result[0].title).to.equal('TestTitle');
      expect(result[0].actor.displayName).to.equal('John Doe');
      done();
    });
  });
});