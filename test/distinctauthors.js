// var mongodb = require('mongodb');

// var mc = mongodb.MongoClient;

// mc.connect('mongodb://localhost:27017/feedrsub', function (err, db) {
//   if (err) {
//     console.log(err);
//     process.exit(1);
//   };

//   var entries = new mongodb.Collection(db, 'entries');
//   var authors = new mongodb.Collection(db, 'authorstest');

//   entries.distinct('actor', function (err, docs) {
//     if (err) {
//       console.log(err);
//       process.exit(1);
//     };
//     //console.log(docs);
//     docs.forEach(function (item, index, array) {
//       var split = item.displayName.split(/[\s,]+/);
//       var givenName = split[0];
//       var familyName = split[1];
      
//       authors.insert({
//         displayName: item.displayName,
//         givenName: givenName,
//         familyName: familyName,
//         id: item.id
//       }
//       , function (err, result) {
//         if (err) {
//           console.log(err);
//           process.exit(1);
//         };
//         console.log(result);
//       });
//     });
//   });
// });
