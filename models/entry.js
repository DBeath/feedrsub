var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var entrySchema = mongoose.Schema({
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