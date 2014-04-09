var express = require('express');
var feedrsub = require('./feedrsub.js');
var mongo = require('./models/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;

var app = module.exports = express();
var server = require('http').createServer(app);

var pubsub = require('./controllers/pubsub.js').pubsub;
var admin = require('./controllers/admin.js').AdminController(pubsub);
module.exports.pubsub = pubsub;

function start() {
  server.listen(config.express.port);
  console.log('Server listening on port %s', config.express.port);
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
  app.enable('trust proxy');
});

var auth = express.basicAuth(config.express.admin, config.express.adminpass);

hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY')
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

app.get('/pubsubhubbub', pubsub.verification.bind(pubsub) );
app.post('/pubsubhubbub', pubsub.notification.bind(pubsub) );


// var init = module.exports.init = function (callback) {
//   console.log('Feedrsub initiating...');
//   mongo.init(function (error) {
//     if (error) console.log(error);

//     //feedrsub.pubsub.listen(config.pubsub.port);
//     app.listen(config.express.port);

//     console.log('App listening on port %s', config.express.port);
//     callback();
//   });
  
// };

// init(function () {
//   console.log('Finished initiation');
// });