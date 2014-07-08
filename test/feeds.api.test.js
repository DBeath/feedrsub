var expect = require('chai').expect;
var request = require('request');
var server = require('../server.js');
var qs = require('querystring');
var async = require('async');
var db = require('../models/db.js');

describe('feeds', function () {
  before(function (done) {
    server.start(function () {
      done();
    });
  });

  after(function (done) {
    server.close(function () {
      done();
    });
  });

  it('should return 400 - Id not valid', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/feed/asdf',
      auth: {
        user: 'admin@feedrsub.com',
        pass: 'password'
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
        user: 'admin@feedrsub.com',
        pass: 'password'
      }
    };
    async.series({
      addFeed: function (callback) {
        db.feeds.subscribe('http://testfeedapi.com', function (err, result) {
          if (err) callback(err);
          callback(null, result);
        });
      },
      findFeed: function (callback) {
        db.feeds.findOneByTopic('http://testfeedapi.com', function (err, doc) {
          if (err) callback(err);
          callback(null, doc);
        });
      }
    }, function (err, results) {
      var doc = results.findFeed;
      postParams.url = 'http://localhost:4000/api/v1/feed/'+doc._id;

      request.get(postParams, function (err, response, body) {
        expect(response.statusCode).to.equal(200);
        var feed = JSON.parse(body);
        expect(feed.topic).to.equal('http://testfeedapi.com');
        expect(feed.status).to.equal('subscribed');
        expect(feed.secret).to.equal(null);
        done();
      });
    });
  });
});