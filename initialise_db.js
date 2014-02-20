var pg = require('pg'),
	config = require('./config.json');

console.log(config.postgres);
pg.connect(config.postgres, function(err, client, done) {
	if(err) {
		return console.error('error fetching client from pool', err);
	}

	client.query('DROP TABLE IF EXISTS subscription', function(err, result) {
		if(err) {
			return console.error('cannot drop table', err);
		}
	});
	client.query('CREATE TABLE subscription (id SERIAL, url VARCHAR(50))', function(err, result){
		if(err) {
			return console.error('cannot create table', err);
		}
	});

	client.query('INSERT INTO subscription(url) VALUES($1),($2),($3)', 
			['http://test2.com', 'http://number2.com', 'http://hahaha.net'], function(err, result){
		if(err) {
			return console.error('error running query', err);
		}
	});

	client.query('SELECT * FROM subscription', function(err, result) {
		if(err) {
			return console.error('error runnning query', err);
		}
		console.log("Row count: %d", result.rows.length);
		for (var i = 0; i < result.rows.length; i++) {
			var row = result.rows[i];
			console.log("id: " + row.id);
			console.log("url: " + row.url);
		}
	});

	done();
});

pg.end();