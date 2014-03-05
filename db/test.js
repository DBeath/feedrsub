var mongo = require('./mongo_database.js');


// mongo.init(function (error) {
// 	mongo.myCollection.insert({'test': 123}, function(err, objects) {
// 		console.log('inserted');
// 	});
// });

var db = new Database();
console.log(db.test);

//var test = db.newCollection('test');

//db.addItem(test, {'test': 123456});