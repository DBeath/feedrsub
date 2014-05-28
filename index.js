var config = require('./config/');
var server = require('./server.js');

server.start(function () {
	console.log('Server started');
});