const express = require('express');
const router = express.Router();
const bookRoutes = require('../controllers/bookController');
const verifyToken = require('../middleware/auth');

// Public routes
// ... existing public routes ...

// Protected routes - require authentication
router.post('/books/:bookId/reviews', verifyToken, bookRoutes.addReview);
router.put('/books/:bookId/reviews/:reviewId', verifyToken, bookRoutes.updateReview);
router.delete('/books/:bookId/reviews/:reviewId', verifyToken, bookRoutes.deleteReview);

module.exports = router; 