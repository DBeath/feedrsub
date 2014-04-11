feedrsub
========

Node.js subscriber for [Superfeedr](http://superfeedr.com/).

## Installation
Install node.js and mongodb.

	sudo apt-get install node.js mongodb

Clone this repository.

	git clone https://github.com/DBeath/feedrsub.git

Navigate to the folder and install the required modules from the package.

	npm install .

Edit the _config.json_ file with your settings for Superfeedr, and the login settings for the admin page.

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

## Usage
To start the app, run ```node index.js```

To subscribe to feeds, the subscribe page has a text field where you can enter a list of feeds separated by newlines, tabs, spaces, or commas.

The unsubscribe button for each feed will send an unsubscribe request to the hub, and mark the status of your feed as unsubscribed. To remove the subscription from the database click the delete button. This will not remove associated entries from the database.

The pending page contains a list of all feeds that are currently pending subscription or unsubscription. A feed should only appear on this page if it failed a subscription or unsubscription request. For each pending feed you can retry sending the request.