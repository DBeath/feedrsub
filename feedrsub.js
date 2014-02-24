var pubSubHubbub = require("./node_modules/pubsubhubbub/index.js"),
    crypto = require("crypto"),
    fs = require("fs"),
    config = require("./config.json");

var pubsub = pubSubHubbub.createServer({
	callbackUrl: config.pubsubhubbub.callbackurl,
	secret: config.pubsubhubbub.secret,
	username: config.pubsubhubbub.username,
	password: config.pubsubhubbub.password
});

pubsub.listen(config.pubsubhubbub.listen.port);

pubsub.on("denied", function(data){
    console.log("Denied");
    console.log(data);
});

pubsub.on("subscribe", function(data){
    console.log("Subscribe");
    console.log(data);

    console.log("Subscribed "+data.topic+" to "+data.hub);
});

pubsub.on("unsubscribe", function(data){
    console.log("Unsubscribe");
    console.log(data);

    console.log("Unsubscribed "+data.topic+" from "+data.hub);
});

pubsub.on("error", function(error){
    console.log("Error");
    console.log(error);
});

pubsub.on("listen", function(){
    console.log("Server listening on port %s", pubsub.port);
});

pubsub.on("feed", function(data){
    console.log(data)
    console.log(data.feed.toString());
});