var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/feedrsub');
var db = mongoose.connection;

var Feed = require('../models/feed');
var Entry = require('../models/entry');
var Author = require('../models/author');

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
    status: 'subscribed',
    subtime: Date.now(),
    title: 'Test Feed'
  });

  var feed2 = new Feed({
    topic: 'http://testingstuff.com/test',
    status: 'unsubscribed',
    subtime: Date.now(),
    unsubtime: Date.now(),
    title: 'Second feed'
  });

  var entry1 = new Entry({
    title: 'Test entry',
    topic: feed1.topic,
    published: Date.now(),
    permalinkUrl: 'http://test.com/testing_entries',
    author: {
      _id: author1._id,
      displayName: author1.displayName
    }
  });

  var entry2 = new Entry({
    title: 'Test entry 2',
    topic: feed2.topic,
    published: Date.now(),
    permalinkUrl: 'http://testingstuff.com/test/secondtest',
    author: {
      _id: author2._id,
      displayName: author2.displayName
    }
  });

  author1.save();
  author2.save();
  feed1.save();
  feed2.save();
  entry1.save();
  entry2.save();
});