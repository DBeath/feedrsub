var express = require('express');
var userController = require('../controllers/users.js').UsersController();
var roles = require('../config/roles.js').user;

var userRouter = express.Router();

userRouter.get('/user/:id/rss', roles.can('access user'), userController.rss);

module.exports.users = userRouter;