var config = require('./config/');
var server = require('./server.js');
var db = require('./models/db.js');

server.start(function () {
	console.log('Server started');

  db.users.findOne('admin@feedrsub.com', function (err, result) {
    if (err) return console.error(err);
    if (!result) {
      db.users.create('admin@feedrsub.com', 'password', 'admin', function (err, result) {
        if (err) return console.error(err);
        return console.log(result);
      });
    } else {
      console.log('Admin account already exists');
    };
  });
});