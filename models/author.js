var mongoose = require('mongoose');

var authorSchema = mongoose.Schema({
  displayName: String,
  givenName: String,
  familyName: String
});

var Author = mongoose.model('Feed', feedSchema);

module.exports = Author;