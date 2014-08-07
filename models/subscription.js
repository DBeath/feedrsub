var mongoose = require('mongoose');
var validator = require('validator');
var ObjectId = mongoose.Schema.Types.ObjectId;

var SubSchema = mongoose.Schema({
  userId: { type: ObjectId },
  email: { type: String, required: true, index: true },
  authorId: { type: ObjectId, required: true, index: true },
  displayName: { type: String: required: true }
});

module.exports = mongoose.model('Subscription', SubSchema);