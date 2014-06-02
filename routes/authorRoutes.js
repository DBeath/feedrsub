var express = require('express');
var authorsController = require('../controllers/authors.js').AuthorsController();

var authors = express.Router();

authors.get('/authors', authorsController.list );
authors.get('/author', authorsController.authorEntries );
authors.get('/author/rss', authorsController.rss );
authors.get('/author/rss/:id', authorsController.rss );

module.exports.authors = authors;