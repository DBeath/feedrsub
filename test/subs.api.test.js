var expect = require('chai').expect;
var request = require('request');
var server = require('../server.js');
var qs = require('querystring');
var config = require('../config');

var User = require('../models/user');

var testEmail = config.express.admin;
var testPassword = config.express.adminpass;
var testRole = 'admin';

describe('subscribe', function () {
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
    User.remove({email: testEmail}, function (err) {
      if (err) throw err;
      server.close(function () {
        return done();
      });
    });
  });

  it('should return 400 - topic not specified', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/subscribe',
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic is not specified');
      return done();
    });
  });

  it('should return 400 - topic is not valid url', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/subscribe',
      auth: {
        user: testEmail,
        pass: testPassword
      },
      form: {
        topic: 'testing'
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic is not valid URL');
      return done();
    });
  });

  it('should return 400 - topic is not valid url (querystring)', function (done) {
    var url = 'http://localhost:4000/api/v1/subscribe/?' + qs.stringify({topic: 'testing'});
    var postParams = {
      url: url,
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      return done();
    });
  });
});

describe('unsubscribe', function () {
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
    User.remove({email: testEmail}, function (err) {
      if (err) throw err;
      server.close(function () {
        return done();
      });
    });
  });

  it('should return 400 - topic not specified', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/unsubscribe',
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic is not specified');
      done();
    });
  });

  it('should return 400 - topic is not valid url', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/unsubscribe',
      auth: {
        user: testEmail,
        pass: testPassword
      },
      form: {
        topic: 'testing'
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic is not valid URL');
      return done();
    });
  });

  it('should return 400 - topic is not valid url (querystring)', function (done) {
    var url = 'http://localhost:4000/api/v1/unsubscribe/?' + qs.stringify({topic: 'testing'});
    var postParams = {
      url: url,
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      return done();
    });
  });
});

describe('retrieve', function () {
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
    User.remove({email: testEmail}, function (err) {
      if (err) throw err;
      server.close(function () {
        return done();
      });
    });
  });

  it('should return 400 - topic not specified', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/retrieve',
      auth: {
        user: testEmail,
        pass: testPassword
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic is not specified');
      return done();
    });
  });

  it('should return 400 - topic is not valid url', function (done) {
    var postParams = {
      url: 'http://localhost:4000/api/v1/retrieve',
      auth: {
        user: testEmail,
        pass: testPassword
      },
      form: {
        topic: 'testing'
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.equal('Topic is not valid URL');
      return done();
    });
  });
})