var expect = require('chai').expect;
var request = require('request');
var crypto = require('crypto');
var async = require('async');
var moment = require('moment');
var nock = require('nock');
var ObjectID = require('mongodb').ObjectID;
var config = require('../config');

var pubsub = require('../controllers/pubsub.js').pubsub;
var server = require('../server.js');
var mongo = require('../models/db.js');

var Feed = require('../models/feed');
var Author = require('../models/author');
var Entry = require('../models/entry');

var thisNow = new Date();
var topic = 'http://test.com';
var subTopic = 'http://subtest.com';
var topicTitle = 'Test Feed';
var itemTitle = 'This is a test';
var itemStatus = 'subscribed';
var item2Title = 'This is the second item';
var authorname = 'Testy Authorson';
var response_body = JSON.stringify(
  {
    "title": topicTitle,
    "status": {
      "http": 200
    },
    "items": [
      {
        "title": itemTitle,
        "published": thisNow,
        "actor": {
          "displayName": authorname,
          "id": authorname
        }
      },
      {
        "title": item2Title,
        "published": thisNow,
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
  before(function (done) {
    server.start(function () {
      var newFeed = new Feed({
        topic: topic,
        status: Feed.statusOptions.SUBSCRIBED,
        subtime: Date.now(),
        secret: encrypted_secret
      }).save(function (err) {
        return done();
      });
    });
  });

  after(function (done) {
    async.parallel([
      function (callback) {
        Feed.remove({}, function (err) {
          return callback(null);
        });
      },
      function (callback) {
        Entry.remove({}, function (err) {
          return callback(null);
        });
      },
      function (callback) {
        Author.remove({}, function (err) {
          return callback(null);
        });
      }
    ], function (err, results) {
      server.close(function () {
        return done();
      });
    });
  });

  it('should exist', function () {
    expect(pubsub).to.exist;
  });

  it('should have correct options', function () {
    expect(pubsub.secret).to.equal('supersecret');
    expect(pubsub.format).to.equal('json');
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
          Feed.findOne({ topic: topic }, function (err, doc) {
            if (err) return callback(err);
            expect(doc.topic, 'feed topic').to.equal(topic);
            expect(doc.title, 'feed title').to.equal(topicTitle);
            callback(null);
          });
        },
        author: function (callback) {
          Author.findOne({ displayName: authorname }, function (err, doc) {
            if (err) return callback(err);
            expect(doc.displayName, 'author DisplayName').to.equal(authorname);
            authorId = doc._id;
            callback(null);
          });
        },
        entry1: function (callback) {
          Entry.findOne({ title: itemTitle }, function (err, doc) {
            if (err) return callback(err);
            console.log(doc);
            expect(doc.topic, 'doc1 topic').to.equal(topic);
            expect(doc.title, 'doc1 title').to.equal(itemTitle);
            expect(doc.published.toString(), 'doc1 published').to.equal(thisNow.toString());
            expect(doc.author.displayName, 'doc1 author').to.equal(authorname);
            expect(doc.author._id.toHexString(), 'doc1 author id').to.equal(authorId.toHexString());
            callback(null);
          });
        },
        entry2: function (callback) {
          Entry.findOne({ title: item2Title }, function (err, doc) {
            if (err) return callback(err);
            expect(doc.topic, 'doc2 topic').to.equal(topic);
            expect(doc.title, 'doc2 title').to.equal(item2Title);
            expect(doc.published, 'doc2 published').to.exist;
            callback(null);
          });
        },
        authornumber: function (callback) {
          Author.count(function (err, result) {
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

  it('should successfully subscribe to a feed', function (done) {
    var hub = nock('http://localhost/')
                .filteringPath(function (path) {
                  return '*';
                })
                .filteringRequestBody(function (path) {
                  return '*';
                })
                .post('*', '*')
                .reply(202);

    pubsub.subscribe(subTopic, config.pubsub.hub, function (err, result) {
      if(!hub.isDone()) {
        console.error('pending mocks: %j', hub.pendingMocks());
      }
      if (err) console.error(err);
      expect(err, 'error').to.equal(null);
      expect(result, 'result').to.equal('Subscribed');
      Feed.findOne({ topic: subTopic }, function (err, feed) {
        expect(err, 'feed error').to.equal(null);
        expect(feed.status, 'feed status').to.equal(Feed.statusOptions.SUBSCRIBED);
        expect(feed.hub, 'feed hub').to.equal(config.pubsub.hub);
        expect(feed.subtime, 'subtime').to.exist;
        expect(feed.topic, 'feed topic').to.equal(subTopic);
        return done();
      });
    });
  });

  it('should unsubscribe from a feed', function (done) {
    var hub = nock('http://localhost/')
                .filteringPath(function (path) {
                  return '*';
                })
                .filteringRequestBody(function (path) {
                  return '*';
                })
                .post('*', '*')
                .reply(202);

    pubsub.unsubscribe(subTopic, function (err, result) {
      if (err) console.error(err);
      expect(err, 'error').to.equal(null);
      expect(result, 'result').to.equal('Unsubscribed');
      Feed.findOne({ topic: subTopic }, function (err, feed) {
        expect(err, 'feed error').to.equal(null);
        expect(feed.unsubtime).to.exist;
        expect(feed.topic, 'feed topic').to.equal(subTopic);
        expect(feed.hub, 'feed hub').to.equal(config.pubsub.hub);
        expect(feed.status, 'feed status').to.equal(Feed.statusOptions.UNSUBSCRIBED);
        return done();
      });
    });
  });
});