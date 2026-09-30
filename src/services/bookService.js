const bookRepository = require('../data/bookRepository');
const loanRepository = require('../data/loanRepository');
const { validateNewBook } = require('../utils/validation');
const { NotFoundError, ConflictError } = require('../utils/errors');

function withAvailability(book, activeCount) {
  return { ...book, available: Math.max(0, book.copies - activeCount) };
}

function countActiveByBook() {
  const counts = new Map();
  for (const loan of loanRepository.findActive()) {
    counts.set(loan.bookId, (counts.get(loan.bookId) || 0) + 1);
  }
  return counts;
}

// `q` matches against title or author.
function listBooks({ q } = {}) {
  let books = bookRepository.findAll();
  if (typeof q === 'string' && q.trim() !== '') {
    const needle = q.trim();
    books = books.filter(
      (book) =>
        book.title.includes(needle) ||
        book.author.includes(needle)
    );
  }
  const counts = countActiveByBook();
  return books.map((book) => withAvailability(book, counts.get(book.id) || 0));
}

function getBook(id) {
  const book = bookRepository.findById(id);
  if (!book) throw new NotFoundError(`Book ${id} not found`);
  return withAvailability(book, loanRepository.countActiveByBook(id));
}

function addBook(input) {
  const data = validateNewBook(input);
  if (data.isbn && bookRepository.findByIsbn(data.isbn)) {
    throw new ConflictError(`A book with ISBN ${data.isbn} already exists`);
  }
  const book = bookRepository.insert(data);
  return withAvailability(book, 0);
}

module.exports = { listBooks, getBook, addBook };
