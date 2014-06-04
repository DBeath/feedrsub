var hbs = require('hbs');
var moment = require('moment');

var registerHelpers = module.exports = function () {
  // Converts unix time to formatted date
  hbs.registerHelper('unix_to_date', function (unixDate) {
    return moment.unix(unixDate).format('DD/MM/YYYY HH:mm:ss');
  });
};