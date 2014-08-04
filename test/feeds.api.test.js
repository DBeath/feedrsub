var expect = require('chai').expect;
var request = require('request');
var server = require('../server.js');
var qs = require('querystring');
var async = require('async');
var db = require('../models/db.js');

var User = require('../models/user');
var Feed = require('../models/feed');

var testEmail = 'admin@test.com';
var testPassword = 'password';
var testRole = 'admin';

var topic = 'http://testfeedapi.com';

describe('feeds', function () {
  before(function (done) {
    server.start(function () {
      var testUser = new User();
      testUser.email = testEmail;
      testUser.password = testPassword;
      testUser.role = testRole;

      testUser.save(function (err) {
        if (err) throw err;
        return done();
      });
    });
  });

  after(function (done) {
    Feed.remove({}, function (err) {
      User.remove({email: testEmail}, function (err) {
        if (err) throw err;
        server.close(function () {
          return done();
        });
      });
    });
  });

  it('should return 400 - Id not valid', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/feed/asdf',
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };
    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Id is not valid');
      done();
    });
  });

  it('should return a feed', function (done) {
    var postParams = {
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };

    var feed = new Feed({
      topic: topic,
      status: Feed.statusOptions.SUBSCRIBED
    }).save(function (err, feed) {
      postParams.url = 'http://localhost:4000/api/v1/feed/'+feed._id;

      request.get(postParams, function (err, response, body) {
        expect(response.statusCode).to.equal(200);
        var feed = JSON.parse(body);
        expect(feed.topic).to.equal(topic);
        expect(feed.status).to.equal(Feed.statusOptions.SUBSCRIBED);
        return done();
      });
    });
  });
});