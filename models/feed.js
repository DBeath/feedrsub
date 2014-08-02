var mongoose = require('mongoose');
var validator = require('validator');

var FeedSchema = mongoose.Schema({
  topic: { type: String, required: true, index: { unique: true } },
  status: { type: String, default: 'pending', required: true },
  subtime: { type: Date, default: Date.now },
  unsubtime: Date,
  secret: String,
  title: String,
  permalinkUrl: String,
  leaseSeconds: Number
});

FeedSchema.virtual('isPending').get(function () {
  return (this.status === statusOptions.PENDING);
});

// status enum for the model
var statusOptions = FeedSchema.statics.statusOptions = {
  SUBSCRIBED: 'Subscribed',
  UNSUBSCRIBED: 'Unsubscribed',
  PENDING: 'Pending'
};

var Feed = mongoose.model('Feed', FeedSchema);

Feed.schema.path('status').validate(function (value) {
  return /Pending|Subscribed|Unsubscribed/i.test(value);
}, 'Invalid status');

Feed.schema.path('topic').validate(function (value) {
  return validator.isUrl(value);
}, 'Topic is not URL');



module.exports = Feed;