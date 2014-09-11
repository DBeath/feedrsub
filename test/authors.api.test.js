var expect = require('chai').expect;
var request = require('request');
var server = require('../server.js');
var qs = require('querystring');
var async = require('async');

var Author = require('../models/author');
var Entry = require('../models/entry');
var User = require('../models/user');

// var authors = [
//   new Author({
//     displayName: 'John Doe'
//   }),
//   new Author({
//     displayName: 'Jane Doe'
//   })
// ];

var author1 = new Author({
  displayName: 'John Doe'
});

var author2 = new Author({
  displayName: 'Jane Doe'
});

var entry1 = new Entry({
  title: 'TestTitle',
  topic: 'http://test.com/feed',
});
entry1.authors.push({
  authorId: author1._id,
  name: author1.displayName
});

var entry2 = new Entry({
  title: 'TestTitle 2',
  topic: 'http://test.com/feed',
});
entry2.authors.push({
  authorId: author2._id,
  name: author2.displayName
});

var testEmail = 'admin@test.com';
var testPassword = 'password';
var testRole = 'admin';

var testUser = new User({
  email: testEmail,
  password: testPassword,
  role: testRole
});

describe('authors', function () {
  before(function (done) {
    server.start(function () {

      async.parallel([
        function (callback) {
          author1.save(function (err) {
            return callback(null);
          });
        },
        function (callback) {
          author2.save(function (err) {
            return callback(null);
          });
        },
        function (callback) {
          entry1.save(function (err) {
            return callback(null);
          });
        },
        function (callback) {
          entry2.save(function (err) {
            return callback(null);
          });
        },
        function (callback) {
          testUser.save(function (err) {
            return callback(null);
          });
        }
      ], function (err, result) {
        return done();
      });
    });
  });

  after(function (done) {
    async.parallel([
      function (callback) {
        Entry.remove({}, function (err) {
          return callback(null);
        });
      },
      function (callback) {
        Author.remove({}, function (err) {
          return callback(null);
        });
      },
      function (callback) {
        User.remove({ email: testEmail }, function (err) {
          return callback(null);
        });
      }
    ], function (err, result) {
      server.close(function () {
        return done();
      });
    });
  });

  it('should return authors', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/authors',
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };

    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(200);
      var result = JSON.parse(body);
      console.log(result);
      expect(result.length).to.equal(2);
      expect(result[0].displayName).to.equal('John Doe');
      return done();
    });
  });

  it('should return entries for an author', function (done) {
    var url = 'http://localhost:4000/api/v1/author/?' + qs.stringify({author: 'John Doe'}); 
    var postParams = {
      url: url,
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };

    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(200);
      var result = JSON.parse(body);
      console.log(result);
      expect(result.length).to.equal(1);
      expect(result[0].title).to.equal('TestTitle');
      expect(result[0].authors[0].name).to.equal('John Doe');
      return done();
    });
  });

  it('should return error: author not found', function (done) {
    var url = 'http://localhost:4000/api/v1/author/?' + qs.stringify({author: 'Jimmy Hendrix'}); 
    var postParams = {
      url: url,
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };

    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(403);
      return done();
    });
  });

  it('should return an rss feed for an author', function (done) {
    var url = 'http://localhost:4000/api/v1/author/rss/?' + qs.stringify({author: 'John Doe'}); 
    var postParams = {
      url: url,
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };

    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(200);
      console.log(body);
      return done();
    });
  });

  it('should return error for rss feed: author not found', function (done) {
    var url = 'http://localhost:4000/api/v1/author/rss/?' + qs.stringify({author: 'Jimmy Hendrix'}); 
    var postParams = {
      url: url,
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };

    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(403);
      return done();
    });
  });
});