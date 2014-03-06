var mongo = require('./mongodb.js');
var moment = require('moment');

mongo.init(function (error) {
	mongo.feeds.insert({'test': 123}, function (err, objects) {
		console.log('inserted');
	});

	mongo.subscriptions.insert({'topic': 'http://test.com'}, function (err, objects) {
		console.log('inserted');
	});

	mongo.subscriptions.insert([{'topic': 'http://test.com', 'subtime': moment().format('X') },
    {'topic': 'http://push-pub.appspot.com', 'subtime': moment().format('X') }], function (err, objects) {
      console.log('inserted');
    });
});