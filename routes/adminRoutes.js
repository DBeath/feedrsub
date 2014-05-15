var express = require('express');
var adminController = require('../controllers/admin.js').AdminController();

var admin = express.Router();

admin.get('/', adminController.index );
admin.get('/unsubscribed', adminController.unsubscribed_feeds );
admin.get('/subscribed', adminController.subscribed_feeds );
admin.get('/pending', adminController.pending_feeds );
admin.get('/authors', adminController.authors );

admin.get('/subscribe', adminController.newfeed );
admin.post('/subscribe', adminController.subscribe );
admin.put('/subscribe/:id', adminController.resubscribe );

admin.put('/unsubscribe/:id', adminController.unsubscribe );

admin.get('/feed/:id', adminController.feed );
admin.delete('/feed/:id', adminController.deletefeed );

module.exports.admin = admin;