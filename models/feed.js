var mongoose = require('mongoose');
var validator = require('validator');

var feedSchema = mongoose.Schema({
  topic: String,
  status: { type: String, default: 'pending' },
  subtime: Date,
  unsubtime: Date,
  secret: String,
  title: String,
  permalinkUrl: String,
  leaseSeconds: Number
});

var Feed = mongoose.model('Feed', feedSchema);

Feed.schema.path('status').validate(function (value) {
  return /pending|subscribed|unsubscribed/i.test(value);
}, 'Invalid status');

Feed.schema.path('topic').validate(function (value) {
  return validator.isUrl(value);
}, 'Topic is not URL');

module.exports = Feed;