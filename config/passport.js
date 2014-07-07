var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var config = require('./index.js');
var db = require('../models/db.js');
var validator = require('validator');

passport.serializeUser(function (user, done) {
  return done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  db.users.findOneById(id, function (err, user) {
    if (err) console.log(err);
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

  db.users.findOne(email, function (err, user) {
    if (err) return done(err);
    if (user) {
      return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
    };
    db.users.create(email, password, function (err, user) {
      if (err) return done(err);
      return done(null, user);
    });
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
    db.users.findOne(email, function (err, user) {
      if (err) return done(err);
      if (!user) {
        console.log('No user found');
        return done(null, false, req.flash('message', 'No user found.'));
      };
      if (!db.users.validPassword(password, user.password)) {
        console.log('Wrong password');
        return done(null, false, req.flash('message', 'Wrong password.'));
      };
      console.log('Valid login');
      //console.log(user);
      
      return done(null, user);
    }); 
  });
}));

passport.use('basic', new BasicStrategy(
  function (email, password, done) {
    db.users.findOne(email, function (err, user) {
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!db.users.validPassword(password, user.password)) {
        return done(null, false);
      };
      return done(null, user);
    });
  }
));

module.exports.passport = passport;