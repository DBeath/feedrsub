var pubSubHubbub = require('pubsubhubbub');
var crypto = require('crypto');
var fs = require('fs');
var config = require('./config.json');
var mongo = require('./db/mongodb.js');
var moment = require('moment');

var pubsub = pubSubHubbub.createServer({
	callbackUrl: config.pubsubhubbub.callbackurl,
	secret: config.pubsubhubbub.secret,
	username: config.pubsubhubbub.username,
	password: config.pubsubhubbub.password,
    format: config.pubsubhubbub.format
});

mongo.init(function (error) {
    
    pubsub.listen(config.pubsubhubbub.listen.port);
});

pubsub.on('denied', function (data){
    console.log("Denied");
    console.log(data);
});

pubsub.on('subscribe', function (data){
    console.log("Subscribe");
    console.log(data);

    mongo.subcriptions.insert({'topic': data.topic, 'subtime': moment().unix()}, {w:1}, 
        function (err) {
            if (err) console.log(err.message);
        });

    console.log("Subscribed "+data.topic+" to "+data.hub+" at "+moment().format());
});

pubsub.on('unsubscribe', function (data){
    console.log("Unsubscribe");
    console.log(data);

    console.log("Unsubscribed "+data.topic+" from "+data.hub);
});

pubsub.on('error', function (error){
    console.log("Error");
    console.log(error);
});

pubsub.on('listen', function (){
    console.log("Server listening on port %s", pubsub.port);
});

pubsub.on('feed', function (data){

    var json = JSON.parse(data);
    for (var i = 0; i < json.items.length; i++) {
        mongo.feeds.insert(json.items[i], {w:1}, function (err) {
            if (err) console.log(err.message);
            else console.log(moment().format()+' | Inserted feed item: '+ json.items[i].title);
        });   
    };   
});