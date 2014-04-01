var expect = require('chai').expect;

var pubsubfile = require('../controllers/pubsub.js');

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