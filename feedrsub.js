var pubSubHubbub = require("./pubsubhubbub/pubsub.js"),
    crypto = require("crypto"),
    fs = require("fs"),
    config = require("./config.json");

var pubsub = pubSubHubbub.createServer({
	callbackUrl : config.pubsubhubbub.callbackurl,
	secret : config.pubsubhubbub.secret,
	username : config.pubsubhubbub.username,
	password : config.pubsubhubbub.password
});

pubsub.listen(config.pubsubhubbub.listen.port);

console.log(process.argv[2]);