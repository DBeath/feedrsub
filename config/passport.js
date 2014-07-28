var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var config = require('./index.js');
var db = require('../models/db.js');
var validator = require('validator');

var User = require('../models/user');

passport.serializeUser(function (user, done) {
  return done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    if (err) console.error(err);
    return done(err, user);
  });
});

// Signup method
passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
function (req, email, password, done) {
  if (!validator.isEmail(email)) {
    return done(null, false, req.flash('signupMessage', 'Not a valid email address.'));
  };

  User.findOne({ email: email }, function (err, user) {
    if (err) return done(err);
    if (user) {
      return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
    } else {
      var newUser = new User();
      newUser.email = email;
      newUser.password = password;

      newUser.save(function (err) {
        if (err) throw err;
        return done(null, newUser);
      });
    };
  });
}));

// Login method
passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
function (req, email, password, done) {
  process.nextTick(function () {
    User.findOne({email: email }, function (err, user) {
      if (err) return done(err);
      if (!user) {
        console.log('No user found');
        return done(null, false, req.flash('loginMessage', 'No user found.'));
      };
      user.comparePassword(password, function (err, isMatch) {
        if (err) return done(err);
        if (!isMatch) {
          console.log('Wrong password');
          return done(null, false, req.flash('loginMessage', 'Wrong password.'));
        };
        return done(null, user);
      });
      // if (!user.validPassword(password)) {
      //   console.log('Wrong password');
      //   return done(null, false, req.flash('loginMessage', 'Wrong password.'));
      // };
      
      // return done(null, user);
    }); 
  });
}));

passport.use('basic', new BasicStrategy(
  function (email, password, done) {
    User.findOne({ email: email }, function (err, user) {
      if (err) return done(err);
      if (!user) return done(null, false);
      user.comparePassword(password, function (err, isMatch) {
        if (err) return done(err);
        if (!isMatch) {
          return done(null, false);
        } else {
          return done(null, user);
        };
      });
      // if (!user.validPassword(password)) {
      //   return done(null, false);
      // };
      // return done(null, user);
    });
  }
));

module.exports.passport = passport;