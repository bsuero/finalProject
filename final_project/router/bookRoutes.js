const express = require('express');
const router = express.Router();
const bookRoutes = require('../controllers/bookController');

// Get all books
router.get('/books', bookRoutes.getAll);

// Search by ISBN
router.get('/books/isbn/:isbn', bookRoutes.getByISBN);

// Search by author or title
router.get('/books/search', bookRoutes.search);

module.exports = router; 