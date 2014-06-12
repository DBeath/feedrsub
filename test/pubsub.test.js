var expect = require('chai').expect;
var request = require('request');
var crypto = require('crypto');
var async = require('async');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;

var pubsub = require('../controllers/pubsub.js').pubsub;
var server = require('../server.js');
var mongo = require('../models/db.js');

var thisNow = moment().unix();
var topic = 'http://test.com';
var topicTitle = 'Test Feed';
var itemTitle = 'This is a test';
var itemStatus = 'Test';
var item2Title = 'This is the second item';
var authorname = 'Testy Authorson';
var response_body = JSON.stringify(
  {
    "title": topicTitle,
    "status": {
      "lastFetch": thisNow,
      "http": 200
    },
    "items": [
      {
        "title": itemTitle,
        "published": thisNow,
        "status": itemStatus,
        "actor": {
          "displayName": authorname,
          "id": authorname
        }
      },
      {
        "title": item2Title,
        "status": itemStatus,
        "actor": {
          "displayName": authorname,
        }
      }
    ]
  }
);
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

describe('authorization', function () {
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

  it('should return 401 - unauthorized (admin page)', function (done) {
    request.get('http://localhost:4000/admin', function (err, response, body) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });

  it('should return 401 - unauthorized (pending page)', function (done) {
    request.get('http://localhost:4000/admin/pending', function (err, response, body) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });

  it('should return 401 - unauthorized (subscribe page)', function (done) {
    request.get('http://localhost:4000/admin/subscribe', function (err, response, body) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });

  it('should return 200 - authorized (admin page)', function (done) {
    var postParams = {
      url: 'http://localhost:4000/admin/',
      auth: {
        user: 'admin',
        pass: 'password'
      }
    }
    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should return 401 - incorrect authorization (admin page)', function (done) {
    var postParams = {
      url: 'http://localhost:4000/admin',
      auth: {
        user: 'administrator',
        pass: 'password1'
      }
    }
    request.get(postParams, function (err, response, body) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });

  it('should return 401 - unauthorized (subscribe api)', function (done) {
    var url = 'http://localhost:4000/api/v1/subscribe';

    request.post(url, function (err, response, body) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });
});

describe('pubsub notification', function () {
  before(function (done) {
    server.start(function () {
      async.series({
        removeFeed: function (callback) {
          mongo.feeds.collection.remove({topic: topic}, function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
        },
        feed: function (callback) {
          mongo.feeds.subscribe(topic, encrypted_secret, function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
        },
        entry: function (callback) {
          mongo.entries.collection.remove({status: 'Test'}, function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
        },
        authors: function (callback) {
          mongo.authors.collection.remove({}, function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
          });
        }
      }, function (err, results) {
        if (err) throw err;
        done();
      });
    });
  });

  after(function (done) {
    server.close(function () {
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

  it('should return 403 - not subscribed to topic', function (done) {
    var options = {
      url: 'http://localhost:4000/pubsubhubbub',
      headers: {
        'link': '<http://test.com/feed>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"',
      }
    };

    request.post(options, function (err, res, body) {
      expect(res.statusCode).to.equal(403);
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

  it('should successfully update a feed with new items', function (done) {
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
      expect(res.statusCode, 'response statusCode').to.equal(204);
    });

    pubsub.on('feed_update', function (data) {
      eventFired = true;
      expect(data.topic, 'data topic').to.equal(topic);
      expect(data.feed, 'data feed').to.exist;
      expect(data.headers['content-type'], 'data content-type header').to.equal('application/json');
    });

    setTimeout(function () {
      var authorId = null;
      expect(eventFired, 'event fired').to.equal(true);
      async.series({
        feed: function (callback) {
          mongo.feeds.findOneByTopic(topic, function (err, doc) {
            if (err) return callback(err);
            expect(doc.topic, 'feed topic').to.equal(topic);
            expect(doc.title, 'feed title').to.equal(topicTitle);
            expect(doc.lastFetch, 'feed lastFetch').to.equal(thisNow);
            expect(doc.http, 'feed http').to.equal(200);
            callback(null);
          });
        },
        author: function (callback) {
          mongo.authors.findOne(authorname, function (err, doc) {
            if (err) return callback(err);
            expect(doc.displayName, 'author DisplayName').to.equal(authorname);
            authorId = doc._id;
            callback(null);
          });
        },
        entry1: function (callback) {
          mongo.entries.collection.findOne({title: itemTitle}, function (err, doc) {
            if (err) return callback(err);
            console.log(doc);
            expect(doc.topic, 'doc1 topic').to.equal(topic);
            expect(doc.title, 'doc1 title').to.equal(itemTitle);
            expect(doc.published, 'doc1 published').to.equal(thisNow);
            expect(doc.status, 'doc1 status').to.equal(itemStatus);
            expect(doc.actor.displayName, 'doc1 author').to.equal(authorname);
            expect(doc.actor.id.toHexString(), 'doc1 author id').to.equal(authorId.toHexString());
            callback(null);
          });
        },
        entry2: function (callback) {
          mongo.entries.collection.findOne({title: item2Title}, function (err, doc) {
            if (err) return callback(err);
            expect(doc.topic, 'doc2 topic').to.equal(topic);
            expect(doc.title, 'doc2 title').to.equal(item2Title);
            expect(doc.published, 'doc2 published').to.exist;
            expect(doc.status, 'doc2 status').to.equal(itemStatus);
            callback(null);
          });
        },
        authornumber: function (callback) {
          mongo.authors.count(function (err, result) {
            if (err) return callback(err);
            expect(result, 'number of authors').to.equal(1);
            callback(null);
          });
        }
      }, function (err, result) {
        if (err) return done();
        done();
      });
    }, 100);
  });
});