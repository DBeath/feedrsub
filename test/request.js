var request = require('request');
var crypto = require('crypto');

var topic = 'http://test.com';
var secret = 'MyTopSecret';
var response_body = "This is a response.";
var encrypted_secret = crypto.createHmac("sha1", secret).update(topic).digest("hex");
var hub_encryption = crypto.createHmac('sha1', encrypted_secret).update(response_body).digest('hex');



var options = {
  url: 'http://localhost:4000/pubsubhubbub',
  headers: {
    'X-Hub-Signature': 'sha1='+hub_encryption,
    'link': '<http://test.com>; rel="self", <http://pubsubhubbub.appspot.com/>; rel="hub"',
  },
  body: response_body + "potentially malicious content"
};

request.post(options, function (err, res, body) {
  console.log(res.statusCode);   
}); 