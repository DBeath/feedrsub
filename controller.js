var mongo = require('./db/mongodb.js');

module.exports.adminController = function () {
  return new admin();
};

function admin () {};

admin.prototype.index = function (req, res) {
  mongo.subscriptions.listAll(function (err, docs) {
    res.render('subscription_list', {
      title: 'Subscriptions', 
      subscriptions: docs
    });
  });
};

admin.prototype.subscription = function (req, res) {
  mongo.subscriptions.findOneById(req.params.id, function (err, doc) {
    if (err) console.log(err);
    mongo.feeds.list(doc.topic, 100, function (err, docs) {
      if (err) console.log(err);
      res.render('subscription', {title: 'Feeds for ' + doc.topic, feeds: docs})
    });
  });
};

admin.prototype.deleteSubscription = function (req, res) {
  mongo.subscriptions.delete(req.params.id, function (err, num) {
    if (err) console.log(err);
    console.log('Deleted %s', req.params.id);
    res.redirect('/');
  });
};

admin.prototype.newSubscription = function (req, res) {
  res.render('new_subscription', {title: 'Subscribe'});
};

admin.prototype.subscribe = function (req, res) {
  mongo.subscriptions.subscribe(req.param('topic'), function (err, result) {
    if (err) console.log(err);
    console.log('Subscribed to %s', req.param('topic'));
    res.redirect('/');
  });
};