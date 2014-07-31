var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var EntrySchema = mongoose.Schema({
  title: String,
  topic: String,
  published: Date,
  updated: Date,
  content: String,
  permalinkUrl: String,
  summary: String,
  actor: {
    id: ObjectId,
    displayName: String
  }
});

module.exports = mongoose.model('Entry', EntrySchema);