var expect = require('chai').expect;
var request = require('request');
var crypto = require('crypto');

var pubsub = require('../controllers/pubsub.js').pubsub;
var server = require('../server.js');

var topic = 'http://test.com';
var response_body = JSON.stringify({foo: 'bar'});
var encrypted_secret = crypto.createHmac("sha1", pubsub.secret).update(topic).digest("hex");
var hub_encryption = crypto.createHmac('sha1', encrypted_secret).update(response_body).digest('hex');

describe('pubsub', function () {
  it('should exist', function () {
    expect(pubsub).to.exist;
  });

  it('should have correct options', function () {
    expect(pubsub.secret).to.equal('supersecret');
    expect(pubsub.format).to.equal('json');
  });
});

describe('pubsub notification', function () {
  before(function (done) {
    server.start(function () {
      done();
    });
  });

  it('should return 400 - no topic', function (done) {
    var options = {
      url: 'http://localhost:4000/pubsubhubbub',
      headers: {
        'link': '<http://pubsubhubbub.appspot.com/>; rel="hub"'
      }
    };

    request.post(options, function (err, res, body) {
      expect(res.statusCode).to.equal(400);
      done();
    });
  });

  it('should return 403 - no X-Hub-Signature', function (done) {
    var options = {
      url: 'http://localhost:4000/pubsubhubbub',
      headers: {
        'link': '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"',
      }
    };

    request.post(options, function (err, res, body) {
      expect(res.statusCode).to.equal(403);
      done();    
    }); 
  });

  it('should return 202 - signature does not match', function (done) {
    var options = {
      url: 'http://localhost:4000/pubsubhubbub',
      headers: {
        'X-Hub-Signature': 'sha1='+hub_encryption,
        'link': '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"',
      },
      body: response_body + "potentially malicious content"
    };

    request.post(options, function (err, res, body) {
      expect(res.statusCode).to.equal(202);
      done();
    });  
  });

  it('should return 204 - sucessful request', function (done) {
    var options = {
      url: 'http://localhost:4000/pubsubhubbub',
      headers: {
        'X-Hub-Signature': 'sha1='+hub_encryption,
        'link': '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"',
        'Content-Type': 'application/json'
      },
      body: response_body
    };
    var eventFired = false;

    request.post(options, function (err, res, body) {
      expect(res.statusCode).to.equal(204);
    });

    pubsub.on('feed_update', function (data) {
      eventFired = true;
      expect(data.topic).to.equal('http://test.com');
    });

    setTimeout(function () {
      expect(eventFired).to.equal(true);
      done();
    }, 10);
  });
});