var config = require('./config/');
var server = require('./server.js');
var db = require('./models/db.js');

var User = require('./models/user');

server.start(function () {
	console.log('Server started');

  User.findOne({ email: config.express.admin }, function (err, result) {
    if (err) return console.error(err);
    if (result) {
      console.log('Admin account already exists');
    } else {
      var admin = new User();
      admin.email = config.express.admin;
      admin.password = config.express.adminpass;
      admin.role = 'admin';

      admin.save(function (err) {
        if (err) throw err;
        return console.log('Created admin with email ' + admin.email);
      });
    };
  });
});