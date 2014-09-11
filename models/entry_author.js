var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var EntryAuthorSchema = mongoose.Schema({
  authorId: ObjectId,
  name: String
});