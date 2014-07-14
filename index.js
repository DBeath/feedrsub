var config = require('./config/');
var server = require('./server.js');
var db = require('./models/db.js');

var User = require('./models/user');

server.start(function () {
	console.log('Server started');

  User.findOne({ email: config.express.admin }, function (err, result) {
    if (err) return console.error(err);
    if (!result) {
      var admin = new User();
      db.users.create(config.express.admin, config.express.password, 'admin', function (err, result) {
        if (err) return console.error(err);
        return console.log(result);
      });
    } else {
      console.log('Admin account already exists');
    };
  });
});