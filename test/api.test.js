var expect = require('chai').expect;
var request = require('request');
var server = require('../server.js');

describe('subscribe', function () {
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

  it('should return 400 - topic not specified', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/subscribe',
      auth: {
        user: 'admin',
        pass: 'password'
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic not specified');
      done();
    });
  });

  it('should return 400 - topic is not valid url', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/subscribe',
      auth: {
        user: 'admin',
        pass: 'password'
      },
      form: {
        topic: 'testing'
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic is not valid URL');
      done();
    });
  });
});
