var expect = require('chai').expect;
var request = require('request');
var server = require('../server.js');
var qs = require('querystring');

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
      expect(response.body).to.equal('Topic is not specified');
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

  it('should return 400 - topic is not valid url (querystring)', function (done) {
    var url = 'http://localhost:4000/api/v1/subscribe/?' + qs.stringify({topic: 'testing'});
    var postParams = {
      url: url,
      auth: {
        user: 'admin',
        pass: 'password'
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      done();
    });
  });
});

describe('unsubscribe', function () {
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
      url: 'http://localhost:4000/api/v1/unsubscribe',
      auth: {
        user: 'admin',
        pass: 'password'
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

  it('should return 400 - topic is not valid url (querystring)', function (done) {
    var url = 'http://localhost:4000/api/v1/unsubscribe/?' + qs.stringify({topic: 'testing'});
    var postParams = {
      url: url,
      auth: {
        user: 'admin',
        pass: 'password'
      }
    };
    request.post(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      done();
    });
  });
});

describe('retrieve', function () {
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
      url: 'http://localhost:4000/api/v1/retrieve',
      auth: {
        user: 'admin',
        pass: 'password'
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
      url: 'http://localhost:4000/api/v1/retrieve',
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
})