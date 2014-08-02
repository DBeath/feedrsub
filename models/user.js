var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var SALT_WORK_FACTOR = 10;
var MAX_LOGIN_ATTEMPTS = 5;
var LOCK_TIME = 2 * 60 * 60 * 1000;

var UserSchema = mongoose.Schema({
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  joined: { type: Date, default: Date.now },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
  lastLogin: { type: Date }
});

UserSchema.pre('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      return next();
    });
  });
});

UserSchema.methods.comparePassword = function (password, callback) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) return callback(err);
    return callback(null, isMatch);
  });
};

// expose enum on the model, and provide an internal convenience reference
var reasons = UserSchema.statics.failedLogin = {
  NOT_FOUND: 0,
  PASSWORD_INCORRECT: 1,
  MAX_ATTEMPTS: 2
};

UserSchema.virtual('isLocked').get(function () {
  // check for a future lockUntil timestamp
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.incLoginAttempts = function (callback) {
  //if we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.update({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    }, callback);
  };

  // otherwise increment
  var updates = { $inc: { loginAttempts: 1 } };
  // lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  };
  return this.update(updates, callback);
};

UserSchema.statics.getAuthenticated = function (email, password, callback) {
  this.findOne({ email: email }, function (err, user) {
    if (err) return callback(err);

    // make sure the user exists
    if (!user) return callback(null, null, reasons.NOT_FOUND);

    // check if the account is currently locked
    if (user.isLocked) {
      // just increment login attempts if account is already locked
      return user.incLoginAttempts(function (err) {
        if (err) return callback(err);
        return callback(null, null, reasons.MAX_ATTEMPTS);
      });
    };

    // test for a matching password
    user.comparePassword(password, function (err, isMatch) {
      if (err) return callback(err);

      // check if the password was a match
      if (isMatch) {
        // if there's no lock or failed attempts, just return the user
        if (!user.loginAttempts && !user.lockUntil) {
          user.update({ $set: { lastLogin: Date.now() } }).exec(function (err) {
            if (err) console.error(err);
          });
          return callback(null, user);
        };
        // reset attempts and lock info
        var updates = {
          $set: { 
            loginAttempts: 0,
            lastLogin: Date.now
          },
          $unset: { lockUntil: 1 }
        };
        return user.update(updates, function (err) {
          if (err) return callback(err);
          return callback(null, user);
        });
      };

      // password is incorrect, so increment login attempts before responding
      user.incLoginAttempts(function (err) {
        if (err) return callback(err);
        return callback(null, null, reasons.PASSWORD_INCORRECT);
      });
    });
  });
};

module.exports = mongoose.model('User', UserSchema);

// Encryption fuctionality from: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
// Locking from: http://devsmash.com/blog/implementing-max-login-attempts-with-mongoose