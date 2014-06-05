var hbs = require('hbs');
var moment = require('moment');
var qs = require('querystring');

var registerHelpers = module.exports = function () {
  // Converts unix time to formatted date
  hbs.registerHelper('unix_to_date', function (unixDate) {
    return moment.unix(unixDate).format('DD/MM/YYYY HH:mm:ss');
  });

  hbs.registerHelper('authorQuery', function (authorString) {
    return qs.stringify({author: authorString});
  });
};