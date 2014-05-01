var config = require('./config.json');
var server = require('./server.js');
var mongo = require('./models/db.js');

// console.log('Starting feedrsub...');
// console.log('Connecting to database...');
// mongo.init(function (err) {
// 	if (err) console.log(err);
// 	console.log('Connected to database. Starting server...');
// 	server.start();
// 	console.log('Server started');
// });

server.start(function () {
	console.log('Server started');
});