var mongoose = require('mongoose');
var validator = require('validator');
var crypto = require('crypto');
var config = require('../config');

var FeedSchema = mongoose.Schema({
  topic: { type: String, required: true, index: { unique: true } },
  status: { type: String, default: 'pending', required: true },
  hub: { type: String, required: true },
  subtime: { type: Date },
  unsubtime: Date,
  secret: String,
  title: String,
  permalinkUrl: String,
  leaseSeconds: Number
});

FeedSchema.pre('save', function (next) {
  var feed = this;
  if (!feed.hub) {
    feed.hub = config.pubsub.hub;
  };
  if (feed.secret) return next();
  if (!config.pubsub.secret) return next();
  feed.secret = crypto.createHmac('sha1', config.pubsub.secret).update(feed.topic).digest('hex');
  return next();
});

FeedSchema.virtual('isPending').get(function () {
  return (this.status === statusOptions.PENDING);
});

// status enum for the model
var statusOptions = FeedSchema.statics.statusOptions = {
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  PENDING: 'pending'
};

var Feed = mongoose.model('Feed', FeedSchema);

Feed.schema.path('status').validate(function (value) {
  return /pending|subscribed|unsubscribed/i.test(value);
}, 'Invalid status');

Feed.schema.path('topic').validate(function (value) {
  return validator.isURL(value);
}, 'Topic is not URL');



module.exports = Feed;