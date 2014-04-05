var request = require('request');
var crypto = require('crypto');

var topic = 'http://test.com';
var secret = 'MyTopSecret';
var response_body = JSON.stringify({foo: 'bar'});
var encrypted_secret = crypto.createHmac("sha1", secret).update(topic).digest("hex");
var hub_encryption = crypto.createHmac('sha1', encrypted_secret).update(response_body).digest('hex');



var options = {
  url: 'http://localhost:4000/pubsubhubbub',
  headers: {
    'X-Hub-Signature': 'sha1='+hub_encryption,
    'link': '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"',
    'Content-Type': 'application/json'
  },
  body: response_body
};
console.log(response_body);
request.post(options, function (err, res, body) {
  console.log(res.statusCode);   
}); 