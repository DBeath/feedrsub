var config = require('./config.json');
var server = require('./server.js');

server.start(function () {
	console.log('Server started');
});