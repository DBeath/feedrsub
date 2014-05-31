var express = require('express');
var authorsController = require('../controllers/authors.js').AuthorsController();

var authors = express.Router();

authors.get('/authors', authorsController.list );
authors.get('/author', authorsController.authorEntries );

module.exports.authors = authors;