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
    console.log('Found %s distinct authors', docs.length);

    docs.forEach(function (item, index, array) {
      var split = item.displayName.split(/[\s,]+/);
      var givenName = split[0];
      var familyName = split[1];
      console.log('Found author %s %s, displayName: %s', givenName, familyName, item.displayName);

      authors.findAndModify({displayName: item.displayName},
      [['displayName', 1]],
      {
        displayName: item.displayName,
        givenName: givenName,
        familyName: familyName,
        id: item.id
      },
      {
        upsert: true,
        new: true,
        w: 1
      }
      , function (err, result) {
        if (err) {
          console.log(err);
          process.exit(1);
        };
        var authorId = result._id;
        var authorName = result.displayName;
        console.log('Created author: %s, Id: %s', authorName, authorId);

        entries.find({'actor.displayName': authorName}).toArray(function (err, result) {
          console.log('Found %s entries for %s', result.length, authorName);
          
          result.forEach(function (item, index, array) {
            entries.update({_id: item._id}, {$set: {'actor.id': authorId}}, function (err) {
              if (err) throw err;
            });
          });
        });
        //console.log(result);
      });
    });
  });
});
