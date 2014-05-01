var express = require('express');
var db = require('./models/db.js');
var config = require('./config.json');
var hbs = require('hbs');
var moment = require('moment');

var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorhandler = require('errorhandler');
var basicAuth = require('basic-auth');

var app = module.exports = express();
var server = null;

// Middleware
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(express.static(__dirname+'/public'));
app.use(errorhandler());
app.use(cookieParser('cookiemonster'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());
app.enable('trust proxy');

//var auth = express.basicAuth(config.express.admin, config.express.adminpass);
var auth = function (req, res, next) {
  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };
  if (user.name === config.express.admin && user.pass === config.express.adminpass) {
    console.log('%s logged in', user.name);
    return next();
  } else {
    return unauthorized(res);
  };
};

function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  res.send(401);
};

// Converts unix time to formatted date
hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY HH:mm:ss');
});

// Routes

// Pubsubhubbub notifications and verification
app.use('/pubsubhubbub', require('./routes/pubsubRoutes.js').pubsub);

// Administration pages
app.all('/admin', auth);
app.use('/admin', require('./routes/adminRoutes.js').admin);

// assume 404 since no middleware responded
app.use(function (req, res, next) {
  res.status(404).render(404, { url: req.originalUrl });
});

// Starts the server and database
function start(done) {
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
function close(done) {
  server.close(function () {
    return done();
  });
};

module.exports.start = start;
module.exports.close = close;