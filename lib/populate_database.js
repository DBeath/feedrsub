var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/feedrsub');
var db = mongoose.connection;

var Feed = require('../models/feed');
var Entry = require('../models/entry');
var Author = require('../models/author');
var User = require('../models/user');
var Subscription = require('../models/subscription');

db.once('open', function () {
  var author1 = new Author({
    displayName: 'John Doe',
    givenName: 'John',
    familyName: 'Doe'
  });

  var author2 = new Author({
    displayName: 'Jane Doe',
    givenName: 'Jane',
    familyName: 'Doe'
  });

  var feed1 = new Feed({
    topic: 'http://test.com',
    hub: 'https://push.superfeedr.com',
    status: 'subscribed',
    subtime: Date.now(),
    title: 'Test Feed'
  });

  var feed2 = new Feed({
    topic: 'http://testingstuff.com/test',
    hub: 'https://push.superfeedr.com',
    status: 'unsubscribed',
    subtime: Date.now(),
    unsubtime: Date.now(),
    title: 'Second feed'
  });

  var entry1 = new Entry({
    title: 'Test entry',
    topic: feed1.topic,
    published: Date.now(),
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    permalinkUrl: 'http://test.com/testing_entries',
  });
  entry1.authors.push({
    authorId: author1._id,
    name: author1.displayName
  });
  entry1.authors.push({
    authorId: author2._id,
    name: author2.displayName
  });

  var entry2 = new Entry({
    title: 'Test entry 2',
    topic: feed2.topic,
    published: Date.now(),
    summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", 
    permalinkUrl: 'http://testingstuff.com/test/secondtest',
  });
  entry2.authors.push({
    authorId: author1._id,
    name: author1.displayName
  });

  var entry3 = new Entry({
    title: 'Test entry 3',
    topic: feed2.topic,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus rhoncus.",
    published: Date.parse('2014-04-08T01:11:23'),
    permalinkUrl: 'http://testingstuff.com/test/thirdtest',
  });
  entry3.authors.push({
    authorId: author2._id,
    name: author2.displayName
  });

  var entry4 = new Entry({
    title: 'Test Entry 4',
    topic: feed2.topic,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus rhoncus.",
    published: Date.parse('2014-06-30T15:34:11'),
    permalinkUrl: 'http://testingstuff.com/meh',
  });
  entry4.authors.push({
    authorId: author2._id,
    name: author2.displayName
  });

  var user1 = new User({
    email: 'macguff@test.com',
    password: 'password',
    role: 'user'
  });

  var user2 = new User({
    email: 'tester@test.com',
    password: 'password',
    role: 'user'
  });

  var sub1 = new Subscription({
    userId: user1._id,
    email: user1.email,
    authorId: author1._id,
    displayName: author1.displayName
  });

  var sub2 = new Subscription({
    userId: user1._id,
    email: user1.email,
    authorId: author2._id,
    displayName: author2.displayName
  });

  author1.save();
  author2.save();
  feed1.save();
  feed2.save();
  entry1.save();
  entry2.save();
  entry3.save();
  entry4.save();
  user1.save();
  user2.save();
  sub1.save();
  sub2.save();
});