var express = require('express');
var feedrsub = require('./feedrsub.js');
var mongo = require('./db/mongodb.js');
var config = require('./config.json');
var hbs = require('hbs');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var admin = require('./controller.js').adminController();

var app = module.exports = express();

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', hbs.__express);
  app.use(express.urlencoded());
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
app.put('/feed/:id', admin.unsubscribe );
app.del('/feed/:id', admin.deletefeed );
app.get('/subscribe', admin.newfeed );
app.post('/subscribe', admin.subscribe );
app.put('/subscribe/:id', admin.resubscribe );
app.get('/unsubscribed', admin.unsubscribed_feeds );


function init() {
  console.log('Feedrsub initiating...');
  mongo.init(function (error) {
    if (error) console.log(error);

    feedrsub.pubsub.listen(config.pubsub.listen.port);
    app.listen(config.express.port);

    console.log('App listening on port %s', config.express.port);
  });
};

init();