var nconf = require('nconf');

nconf.argv().env();
var env = nconf.get("NODE_ENV") || 'development';

nconf.file(env, './config/' + env + '.json');
nconf.file('default', './config/default.json');

var conf = nconf.load();

console.log('NODE_ENV: '+ env);
console.log('Database: '+ conf.express.connstring);
console.log();

module.exports = conf;