var express = require('express');
var mongo = require('./models/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;

var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorhandler = require('errorhandler');
var basicAuth = require('basic-auth');

var app = module.exports = express();
var server = null;

var pubsub = require('./controllers/pubsub.js').pubsub;
var admin = require('./controllers/admin.js').AdminController();
module.exports.pubsub = pubsub;

app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(express.static(__dirname+'/public'));
app.use(require('errorhandler')());
app.use(cookieParser('cookiemonster'));
app.use(session({ cookie: { secure: true }}));
app.use(flash());
app.use(errorhandler());
app.enable('trust proxy');

//var auth = express.basicAuth(config.express.admin, config.express.adminpass);
var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=secure');
    return res.send(401);
  };
  var user = basicAuth(req);
  if (!user) {
    unauthorized(res);
  };
  if (user.name === config.express.admin && user.pass === config.express.adminpass) {
    return next();
  } else {
    unauthorized(res);
  };
};

hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY HH:mm:ss');
});

app.get('/admin', auth, admin.index );
app.get('/unsubscribed', auth, admin.unsubscribed_feeds );
app.get('/subscribed', auth, admin.subscribed_feeds );
app.get('/pending', auth, admin.pending_feeds );

app.get('/subscribe', auth, admin.newfeed );
app.post('/subscribe', auth, admin.subscribe );
app.put('/subscribe/:id', auth, admin.resubscribe );

app.put('/unsubscribe/:id', auth, admin.unsubscribe );

app.get('/feed/:id', auth, admin.feed );
app.del('/feed/:id', auth, admin.deletefeed );

app.get('/pubsubhubbub', pubsub.verification.bind(pubsub) );
app.post('/pubsubhubbub', pubsub.notification.bind(pubsub) );

// assume 404 since no middleware responded
app.use(function (req, res, next) {
  res.status(404).render(404, { url: req.originalUrl });
});

function start(done) {
  console.log('Starting feedrsub...');
  console.log('Connecting to database...');
  mongo.init(function (err, result) {
    if (err) {
      console.log(err);
      process.exit(1);
    };
    console.log(result);
    console.log('Connected to database. Starting server...');
    server = app.listen(config.express.port);
    console.log('Server listening on port %s', config.express.port);
    return done();
  });
};

function close(done) {
  server.close(function () {
    return done();
  });
};

module.exports.start = start;
module.exports.close = close;