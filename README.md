feedrsub
========

Node.js subscriber and admin page for [Superfeedr](http://superfeedr.com/) subscriptions.

## Installation
Install node.js and mongodb.

	sudo apt-get install node.js mongodb

Clone this repository.

	git clone https://github.com/DBeath/feedrsub.git

Navigate to the folder and install the required modules from the package.

	npm install .

Edit the _config.json_ file with your settings for Superfeedr, and the login settings for the admin page.

## Config settings

**Pubsub**
* **hub** The URL of the pubsubhubbub hub you are subscribing to.
* **username** (optional) Your username for the hub.
* **password** (optional) Your password for the hub.
* **secret** (optional) A secret value for HMAC signatures.
* **format** (optional) The format to receive notifications in. Currently only accepts JSON.
* **domain** The FQDN where you are hosting this app.

**Express**
* **admin** The username for admin login.
* **password** The password for admin login.
* **port** The port this app will listen on.
* **connString** The connection string for MongoDB. Defaults to ```mongodb://localhost:27017/feedrsub```.

#### Webservers
If you're running feedrsub behind a webserver, then you'll need to configure it to pass requests to the appropriate port.

nginx example:

	server {
	  listen 80;
	  server_name example.com 

	  location / {
            proxy_pass http://localhost:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
          }
	}

## Main Routes
**Note** this is not currently a fully functional api.

**Require Authentication**
* ```GET /admin``` The main admin page.
* ```GET /admin/subscribed``` A list of current subscriptions.
* ```GET /admin/unsubscribed``` A list of unsubscribed feeds.
* ```GET /admin/pending``` A list of pending subscriptions and unsubscriptions.
* ```GET /admin/subscribe``` The subscribe page.
* ```POST /admin/subscribe``` Subscribes to feeds. Reads the ```topic:``` parameter of the body, followed by a list of feed URLs separated by newlines, tabs, spaces, or commas.

**No authentication**
* ```GET /pubsubhubbub``` The URL the hub will call to receive verification of a subscription request.
* ```POST /pubsubhubbub``` The URL the hub will post feed update notifications to.

## Usage
To start the app, run ```node index.js```

To subscribe to feeds, the subscribe page has a text field where you can enter a list of feeds separated by newlines, tabs, spaces, or commas.

The unsubscribe button for each feed will send an unsubscribe request to the hub, and mark the status of your feed as unsubscribed. To remove the subscription from the database click the delete button. This will not remove associated entries from the database.

The pending page contains a list of all feeds that are currently pending subscription or unsubscription. A feed should only appear on this page if it failed a subscription or unsubscription request. For each pending feed you can retry sending the request.
