const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your actual JWT secret key

// In-memory data structures
let users = [];
const books = [
    {
        id: 1,
        title: "Book One",
        author: "Author One",
        isbn: "11",
        reviews: [
            { id: 1, user: "User1", rating: 4, comment: "Great book!" },
            { id: 2, user: "User2", rating: 5, comment: "Loved it!" }
        ]
    },
    {
        id: 2,
        title: "Book Two",
        author: "Author Two",
        isbn: "22",
        reviews: [
            { id: 3, user: "User3", rating: 3, comment: "It was okay." },
            { id: 4, user: "User4", rating: 4, comment: "Enjoyed reading this." }
        ]
    }
];

// GET /books to retrieve all books
app.get('/books', (req, res) => {
    res.json(books);
});

// GET /books/isbn/:isbn to retrieve a book by ISBN
app.get('/books/isbn/:isbn', (req, res) => {
    const { isbn } = req.params;
    const book = books.find(b => b.isbn === isbn);

    if (book) {
        res.json(book);
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

// GET /books/author/:authorName to retrieve books by author
app.get('/books/author/:authorName', (req, res) => {
    const { authorName } = req.params;
    const booksByAuthor = books.filter(book => book.author.toLowerCase() === authorName.toLowerCase());

    if (booksByAuthor.length > 0) {
        res.json(booksByAuthor);
    } else {
        res.status(404).json({ message: 'No books found for this author' });
    }
});

// GET /books/title/:title to retrieve books by title
app.get('/books/title/:title', (req, res) => {
    const { title } = req.params;
    const booksByTitle = books.filter(book => book.title.toLowerCase() === title.toLowerCase());

    if (booksByTitle.length > 0) {
        res.json(booksByTitle);
    } else {
        res.status(404).json({ message: 'No books found with this title' });
    }
});

// GET /books/:isbn/reviews to retrieve all reviews for a book
app.get('/books/:isbn/reviews', (req, res) => {
    const { isbn } = req.params;
    const book = books.find(b => b.isbn === isbn);

    if (book) {
        res.json(book.reviews);
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

// PUT /books/:isbn/reviews/:reviewId to update a review
app.put('/books/:isbn/reviews/:reviewId', authenticateToken, (req, res) => {
    const { isbn, reviewId } = req.params;
    const { rating, comment } = req.body;
    const book = books.find(b => b.isbn === isbn);

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    const review = book.reviews.find(r => r.id == reviewId && r.user === req.user.username);
    if (!review) {
        return res.status(403).json({ message: 'Review not found or unauthorized' });
    }

    review.rating = rating;
    review.comment = comment;

    res.json({ message: 'Review updated successfully', review });
});

// POST /books/:isbn/reviews to add a new review
app.post('/books/:isbn/reviews', authenticateToken, (req, res) => {
    const { isbn } = req.params;
    const { rating, comment } = req.body;
    const book = books.find(b => b.isbn === isbn);

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    const newReview = {
        id: Date.now(),
        user: req.user.username,
        rating,
        comment
    };
    book.reviews.push(newReview);
    res.status(201).json({ message: 'Review added successfully', review: newReview });
});

// DELETE /books/:isbn/reviews/:reviewId to delete a review
app.delete('/books/:isbn/reviews/:reviewId', authenticateToken, (req, res) => {
    const { isbn, reviewId } = req.params;
    const book = books.find(b => b.isbn === isbn);

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    const reviewIndex = book.reviews.findIndex(r => r.id == reviewId && r.user === req.user.username);
    if (reviewIndex === -1) {
        return res.status(403).json({ message: 'Review not found or unauthorized' });
    }

    book.reviews.splice(reviewIndex, 1);
    res.status(200).json({ message: 'Review deleted successfully' });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
