var nconf = require('nconf');

nconf.argv().env();
var env = nconf.get("NODE_ENV") || 'development';

nconf.file(env, './config/' + env + '.json');
nconf.file('default', './config/default.json');

console.log('NODE_ENV: '+ nconf.get('NODE_ENV'));
console.log('Database: '+ nconf.get('express:connstring'));
var conf = nconf.load();
console.log(conf.express.connstring);
module.exports = conf;