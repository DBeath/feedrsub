var mongo = require('./mongodb.js');


mongo.init(function (error) {
	mongo.feeds.insert({'test': 123}, function(err, objects) {
		console.log('inserted');
	});
});

// var db = new Database();
// console.log(db.test);

//var test = db.newCollection('test');

//db.addItem(test, {'test': 123456});