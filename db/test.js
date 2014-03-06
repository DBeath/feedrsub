var mongo = require('./mongodb.js');
var moment = require('moment');


mongo.init(function (error) {
	mongo.feeds.insert({'test': 123}, function (err, objects) {
		console.log('inserted');
	});
  var now = moment().format('X');
	mongo.subscriptions.insert([{'topic': 'http://test.com', 'subtime': moment().format('X') },
    {'topic': 'http://push-pub.appspot.com', 'subtime': moment().format('X') }], function (err, objects) {
      console.log('inserted');
    });
});

// var db = new Database();
// console.log(db.test);

//var test = db.newCollection('test');

//db.addItem(test, {'test': 123456});