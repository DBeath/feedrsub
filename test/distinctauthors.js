var mongodb = require('mongodb');

var mc = mongodb.MongoClient;

mc.connect('mongodb://localhost:27017/feedrsub', function (err, db) {
  if (err) {
    console.log(err);
    process.exit(1);
  };

  var entries = new mongodb.Collection(db, 'entries');
  var authors = new mongodb.Collection(db, 'authors');

  entries.distinct('actor', function (err, docs) {
    if (err) {
      console.log(err);
      process.exit(1);
    };
    console.log(docs);
    docs.forEach(function (item, index, array) {
      authors.insert(item, function (err, result) {
        if (err) {
          console.log(err);
          process.exit(1);
        };
        console.log(result);
      });
    });
  });
});