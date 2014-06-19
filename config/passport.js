var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require('./index.js');
var db = require('../models/db.js');
var validator = require('validator');

passport.serializeUser(function (user, callback) {
  console.log('Serialized user');
  console.log(user);
  callback(null, user);
});

passport.deserializeUser(function(id, callback) {
  db.users.findOneById(id, function (err, user) {
    callback(err, user);
  });
});

// Signup method
passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
function (req, email, password, callback) {
  if (!validator.isEmail(email)) {
    return callback(null, false, req.flash('signupMessage', 'Not a valid email address.'));
  };

  db.users.findOne(email, function (err, user) {
    if (err) return callback(err);
    if (user) {
      return callback(null, false, req.flash('signupMessage', 'That email is already taken.'));
    };
    db.users.create(email, password, function (err, user) {
      if (err) return callback(err);
      return callback(null, user);
    });
  });
}));

// Login method
passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
function (req, email, password, callback) {
  process.nextTick(function () {
    db.users.findOne(email, function (err, user) {
      if (err) return callback(err);
      if (!user) {
        return callback(null, false, req.flash('message', 'No user found.'));
      };
      if (!db.users.validPassword(password, user.password)) {
        return callback(null, false, req.flash('message', 'Wrong password.'));
      };
      console.log('Valid login');
      //console.log(user);
      
      return callback(null, user);
    });
    
  });
}));

module.exports.passport = passport;