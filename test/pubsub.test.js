var expect = require('chai').expect;
var request = require('request');

var pubsubfile = require('../controllers/pubsub.js');
var init = require('../app.js').init;

var pubsub = pubsubfile.pubsubController({
  secret: 'MyTopSecret',
  domain: 'http://localhost:4000',
  format: 'json',
  username: 'admin',
  password: 'P@ssw0rd'
});

describe('pubsub', function () {
  it('should exist', function () {
    expect(pubsub).to.exist;
  });

  it('should have correct options', function () {
    expect(pubsub.secret).to.equal('MyTopSecret');
    expect(pubsub.format).to.equal('json');
  });
});

describe('pubsub notification', function () {
  before(function () {
    init(function () {
      console.log('initiated');
    });
  });

  it('should return 400 - no topic', function (done) {
    var options = {
      url: 'http://localhost:4000/pubsubhubbub',
      headers: {
        'link': '<http://pubsubhubbub.appspot.com/>; rel="hub"'
      }
    };

    request.post(options, function (err, response, body) {
      expect(response.statusCode).to.equal(400);
      done();
    });
  });
});