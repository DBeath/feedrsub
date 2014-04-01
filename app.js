var express = require('express');
var feedrsub = require('./feedrsub.js');
var mongo = require('./models/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var admin = require('./controllers/admin.js').adminController();

var pubsub = module.exports = require('./controllers/pubsub.js').pubsubController({
  secret: config.pubsub.secret,
  domain: config.pubsub.domain,
  format: config.pubsub.format,
  username: config.pubsub.username,
  password: config.pubsub.password
});

var app = module.exports = express();

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.use(express.urlencoded());
  app.use(express.json());
  app.use(express.methodOverride());
  app.use(express.static(__dirname+'/public'));
  app.use(express.errorHandler());
  app.use(express.basicAuth(config.express.admin, config.express.adminpass));
});

hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY')
});

app.get('/', admin.index );
app.get('/feed/:id', admin.feed );
app.put('/unsubscribe/:id', admin.unsubscribe );
app.del('/feed/:id', admin.deletefeed );
app.get('/subscribe', admin.newfeed );
app.post('/subscribe', admin.subscribe );
app.put('/subscribe/:id', admin.resubscribe );
app.get('/unsubscribed', admin.unsubscribed_feeds );
app.get('/subscribed', admin.subscribed_feeds );

app.get('/pubsubhubbub', pubsub.verification );
app.post('/pubsubhubbub', pubsub.notification );


var init = module.exports = function () {
  console.log('Feedrsub initiating...');
  mongo.init(function (error) {
    if (error) console.log(error);

    //feedrsub.pubsub.listen(config.pubsub.port);
    app.listen(config.express.port);

    console.log('App listening on port %s', config.express.port);
  });
};

init();