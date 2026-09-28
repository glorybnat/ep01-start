const store = require('./jsonStore');

const COLLECTION = 'books';

function findAll() {
  return store.readAll(COLLECTION);
}

function findById(id) {
  return findAll().find((book) => book.id === id) || null;
}

function findByIsbn(isbn) {
  return findAll().find((book) => book.isbn === isbn) || null;
}

function insert(data) {
  const books = findAll();
  const book = { id: store.nextId('b', books), ...data };
  books.push(book);
  store.writeAll(COLLECTION, books);
  return book;
}

module.exports = { findAll, findById, findByIsbn, insert };
