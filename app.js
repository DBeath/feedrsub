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
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler());
  app.use(express.basicAuth(config.express.admin, config.express.adminpass));
});

hbs.registerHelper('unix_to_date', function (unixDate) {
  return moment.unix(unixDate).format('DD/MM/YYYY')
});

app.get('/', admin.index );
app.get('/subscription/:id', admin.subscription );
app.del('/subscription/:id', admin.deleteSubscription );
app.get('/subscribe', admin.newSubscription );
app.post('/subscribe', admin.subscribe );

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