var express = require('express');
var mongo = require('./models/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var flash = require('connect-flash');

var app = module.exports = express();
var server = require('http').createServer(app);

var pubsub = require('./controllers/pubsub.js').pubsub;
var admin = require('./controllers/admin.js').AdminController(pubsub);
module.exports.pubsub = pubsub;

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
    server.listen(config.express.port);
    console.log('Server listening on port %s', config.express.port);
    done();
  });
};

module.exports.start = start;

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.use(express.urlencoded());
  //app.use(express.json());
  app.use(express.methodOverride());
  app.use(express.static(__dirname+'/public'));
  app.use(express.errorHandler());
  app.use(express.cookieParser('cookiemonster'));
  app.use(express.session({ cookie: { maxAge: 60000 }}));
  app.use(flash());
  app.enable('trust proxy');
});

var auth = express.basicAuth(config.express.admin, config.express.adminpass);

hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY HH:mm:ss');
});

app.get('/admin', auth, admin.index );
app.get('/feed/:id', auth, admin.feed );
app.put('/unsubscribe/:id', auth, admin.unsubscribe );
app.del('/feed/:id', auth, admin.deletefeed );
app.get('/subscribe', auth, admin.newfeed );
app.post('/subscribe', auth, admin.subscribe );
app.put('/subscribe/:id', auth, admin.resubscribe );
app.get('/unsubscribed', auth, admin.unsubscribed_feeds );
app.get('/subscribed', auth, admin.subscribed_feeds );
app.get('/pending', auth, admin.pending_feeds );

app.get('/pubsubhubbub', pubsub.verification.bind(pubsub) );
app.post('/pubsubhubbub', pubsub.notification.bind(pubsub) );