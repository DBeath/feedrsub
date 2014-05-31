var express = require('express');
var db = require('./models/db.js');

var hbs = require('hbs');
var moment = require('moment');
var nconf = require('nconf');

var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorhandler = require('errorhandler');
var basicAuth = require('basic-auth');
//var csurf = require('csurf');

var app = module.exports = express();
var server = null;

// Set up configs
var config = require('./config/');

// Middleware
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(express.static(__dirname+'/public'));
app.use(errorhandler());

var cookiesecret = null;
if (config.express.cookiesecret) {
  cookiesecret = config.express.cookiesecret;
};
app.use(cookieParser(cookiesecret));

var sessionsecret = 'notsuchagoodsecret';
if (config.express.sessionsecret) {
  sessionsecret = config.express.sessionsecret;
};
app.use(session({ 
  secret: sessionsecret,
  cookie: { maxAge: 60000 }
}));

app.use(flash());
//app.use(csurf());
app.enable('trust proxy');

// Authentication handler
var auth = function (req, res, next) {
  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };
  if (user.name === config.express.admin && user.pass === config.express.adminpass) {
    return next();
  } else {
    return unauthorized(res);
  };
};

// Send unauthorized response
function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  res.send(401);
};

var csrf = function (req, res, next) {
  res.locals.csrftoken = req.csrfToken();
  next();
};

// Converts unix time to formatted date
hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY HH:mm:ss');
});

// Routes

// Pubsubhubbub notifications and verification
app.use('/pubsubhubbub', require('./routes/pubsubRoutes.js').pubsub);

// Administration pages
app.all('/admin*', auth);
app.use('/admin', require('./routes/adminRoutes.js').admin);

// Api
app.all('/api/v1*', auth);
app.use('/api/v1', require('./routes/subscriptionsRoutes.js').subs);
app.use('/api/v1', require('./routes/feedsRoutes.js').feeds);

app.use('/api/v1', require('./routes/authorRoutes.js').authors);

app.use(require('./lib/errors.js').StatusErrorHandler);
app.use(require('./lib/errors.js').ErrorHandler);

// assume 404 since no middleware responded
app.use(function (req, res, next) {
  res.status(404).render(404, {
    layout: '404_layout', 
    url: req.originalUrl 
  });
});

// Starts the server and database
var start = function (done) {
  console.log('Starting feedrsub...');
  console.log('Connecting to database...');
  db.init(function (err, result) {
    if (err) {
      console.error(err);
      process.exit(1);
    };
    console.log(result);
    console.log('Connected to database. Starting server...');
    server = app.listen(config.express.port);
    console.log('Server listening on port %s', config.express.port);
    return done();
  });
};

// Closes the server
var close = function (done) {
  console.log('Closing the database connection...');
  db.close(function (err) {
    if (err) console.log(err);
    console.log('Stopping the server...');
    server.close(function () {
      console.log('Server has shutdown.');
      console.log('Server was running for',Math.round(process.uptime()),'seconds');
      return done();
    });
    setTimeout(function () {
      console.log('Server took too long to shutdown, forcing shutdown');
      return done();
    }, 2000);
  });
};

// Gracefully closes the server on SIGTERM event
process.on('SIGTERM', function () {
  console.log('\nReceived SIGTERM, closing server.');
  close(function () {
    process.exit(0);
  });
});

// Gracefully closes the server on SIGINT event
process.on('SIGINT', function () {
  console.log('\nReceived SIGINT, closing server.');
  close(function () {
    process.exit(0);
  });
});

module.exports.start = start;
module.exports.close = close;