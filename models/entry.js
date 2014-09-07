var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var EntrySchema = mongoose.Schema({
  title: String,
  topic: { type: String, required: true },
  published: { type: Date, default: Date.now(), required: true },
  updated: { type: Date, default: Date.now() },
  content: String,
  permalinkUrl: String,
  summary: String,
  author: {
    _id: ObjectId,
    displayName: String
  }
});

module.exports = mongoose.model('Entry', EntrySchema);