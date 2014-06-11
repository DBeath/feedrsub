var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require('./index.js');

passport.use(new LocalStrategy(
  function (username, password, done) {
    if (username === config.express.admin && password === config.express.adminpass) {
      return done(null, user);
    }
  }
))