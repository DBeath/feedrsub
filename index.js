var config = require('./config/');
var server = require('./server.js');
var db = require('./models/db.js');

server.start(function () {
	console.log('Server started');

  db.users.findOne(config.express.admin, function (err, result) {
    if (err) return console.error(err);
    if (!result) {
      db.users.create(config.express.admin, config.express.password, 'admin', function (err, result) {
        if (err) return console.error(err);
        return console.log(result);
      });
    } else {
      console.log('Admin account already exists');
    };
  });
});