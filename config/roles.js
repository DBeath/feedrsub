var ConnectRoles = require('connect-roles');

var user = new ConnectRoles({
  failureHandler: function (req, res, action) {
    // optional function to customise code that runs when
    // user fails authorisation
    // var accept = req.headers.accept || '';
    // res.status(403);
    // if (~accept.indexOf('html')) {
    //   res.render('access-denied', {action: action});
    // } else {
    //   res.send('Access Denied - You don\'t have permission to: ' + action);
    // }
    req.session.returnTo = req.originalUrl || req.url;
    res.redirect('/login');
  }
});

user.use(function (req, action) {
  if (!req.isAuthenticated()) return action === 'access home page';
});

user.use('access admin page', function (req) {
  if (req.user.role === 'admin') {
    return true;
  };
});

user.use('access user', function (req) {
  if (req.user._id.toString() === req.params.id.toString()) {
    console.log('returning true');
    return true;
  } else {
    console.log('returning false');
  };
});

module.exports.user = user;