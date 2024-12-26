const Book = require('../models/Book');

// Get all books using async/callback
const getAllBooks = async (callback) => {
  try {
    // If using MongoDB
    const booksFromDB = await Book.find({});
    callback(null, booksFromDB);

  } catch (error) {
    callback(error, null);
  }
};

// Search by ISBN using Promises
const findBookByISBN = (ISBN) => {
  return new Promise((resolve, reject) => {
    if (!ISBN) {
      reject(new Error('ISBN is required'));
      return;
    }

    // If using MongoDB
    Book.findOne({ isbn: ISBN })
      .then(book => {
        if (!book) {
          // Try local array as fallback
          const localBook = books.find((b) => b.isbn === ISBN);
          if (localBook) {
            resolve(localBook);
          } else {
            reject(new Error(`Book with ISBN ${ISBN} not found`));
          }
        } else {
          resolve(book);
        }
      })
      .catch(error => reject(error));
  });
};

// Search books by author or title using Promises
const searchBooks = (searchTerm) => {
  return new Promise((resolve, reject) => {
    Book.find({
      $or: [
        { author: { $regex: searchTerm, $options: 'i' } },
        { title: { $regex: searchTerm, $options: 'i' } }
      ]
    })
      .then(books => {
        if (books.length === 0) {
          reject(new Error('No books found'));
        }
        resolve(books);
      })
      .catch(error => reject(error));
  });
};

// New function to get books by review rating
const getBooksByReview = (rating) => {
  return new Promise((resolve, reject) => {
    Book.find({ rating: { $gte: rating } })
      .sort({ rating: -1 })
      .then(books => {
        if (books.length === 0) {
          reject(new Error(`No books found with rating ${rating} or higher`));
        }
        resolve(books);
      })
      .catch(error => reject(error));
  });
};

// Add a review to a book
const addBookReview = (bookId, userId, reviewData) => {
  return new Promise((resolve, reject) => {
    const review = {
      userId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date()
    };

    Book.findByIdAndUpdate(
      bookId,
      { 
        $push: { reviews: review },
        $set: { 
          rating: reviewData.rating // Update book's overall rating
        }
      },
      { new: true }
    )
    .then(book => {
      if (!book) {
        reject(new Error('Book not found'));
      }
      resolve(book);
    })
    .catch(error => reject(error));
  });
};

// Update a review
const updateBookReview = (bookId, reviewId, userId, reviewData) => {
  return new Promise((resolve, reject) => {
    Book.findOneAndUpdate(
      { 
        _id: bookId,
        'reviews._id': reviewId,
        'reviews.userId': userId // Ensure user owns the review
      },
      {
        $set: {
          'reviews.$.rating': reviewData.rating,
          'reviews.$.comment': reviewData.comment,
          'reviews.$.updatedAt': new Date()
        }
      },
      { new: true }
    )
    .then(book => {
      if (!book) {
        reject(new Error('Review not found or unauthorized'));
      }
      resolve(book);
    })
    .catch(error => reject(error));
  });
};

// Delete a review
const deleteBookReview = (bookId, reviewId, userId) => {
  return new Promise((resolve, reject) => {
    Book.findOneAndUpdate(
      { _id: bookId },
      {
        $pull: { reviews: { _id: reviewId, userId: userId } }
      },
      { new: true }
    )
    .then(book => {
      if (!book) {
        reject(new Error('Review not found or unauthorized'));
      }
      resolve(book);
    })
    .catch(error => reject(error));
  });
};

const bookRoutes = {
  // Get all books (public access)
  getAll: (req, res) => {
    getAllBooks((error, books) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(books);
    });
  },

  // Search by ISBN (public access)
  getByISBN: (req, res) => {
    const { isbn } = req.params;
    
    findBookByISBN(isbn)
      .then(book => res.json(book))
      .catch(error => res.status(404).json({ error: error.message }));
  },

  // Advanced search (public access)
  advancedSearch: (req, res) => {
    const { author, title, rating } = req.query;
    
    let searchQuery = {};
    
    if (author) {
      searchQuery.author = { $regex: author, $options: 'i' };
    }
    if (title) {
      searchQuery.title = { $regex: title, $options: 'i' };
    }
    if (rating) {
      searchQuery.rating = { $gte: parseFloat(rating) };
    }

    Book.find(searchQuery)
      .sort({ rating: -1 })
      .then(books => {
        if (books.length === 0) {
          return res.status(404).json({ message: 'No books found matching criteria' });
        }
        res.json(books);
      })
      .catch(error => res.status(500).json({ error: error.message }));
  },

  // Get books by review rating (public access)
  getByReview: (req, res) => {
    const { rating } = req.params;
    const numRating = parseFloat(rating);

    if (isNaN(numRating) || numRating < 0 || numRating > 5) {
      return res.status(400).json({ error: 'Invalid rating value. Must be between 0 and 5' });
    }

    getBooksByReview(numRating)
      .then(books => res.json(books))
      .catch(error => res.status(404).json({ error: error.message }));
  },

  // Add a new review (protected route)
  addReview: (req, res) => {
    const { bookId } = req.params;
    const userId = req.user.id; // From JWT token
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    addBookReview(bookId, userId, { rating, comment })
      .then(book => res.json(book))
      .catch(error => res.status(400).json({ error: error.message }));
  },

  // Update a review (protected route)
  updateReview: (req, res) => {
    const { bookId, reviewId } = req.params;
    const userId = req.user.id; // From JWT token
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    updateBookReview(bookId, reviewId, userId, { rating, comment })
      .then(book => res.json(book))
      .catch(error => res.status(400).json({ error: error.message }));
  },

  // Delete a review (protected route)
  deleteReview: (req, res) => {
    const { bookId, reviewId } = req.params;
    const userId = req.user.id; // From JWT token

    deleteBookReview(bookId, reviewId, userId)
      .then(book => res.json(book))
      .catch(error => res.status(400).json({ error: error.message }));
  }
};

module.exports = bookRoutes; 