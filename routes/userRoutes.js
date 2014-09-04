var express = require('express');
var userController = require('../controllers/user.js').UserController();
var roles = require('../config/roles.js').user;

var userRouter = express.Router();

userRouter.get('/user/:id/rss', roles.can('access user'), userController.rss);

module.exports.users = userRouter;