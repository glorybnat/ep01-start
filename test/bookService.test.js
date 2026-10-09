const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { useTempData } = require('./helpers');
const bookService = require('../src/services/bookService');

describe('bookService', () => {
  let cleanup;
  beforeEach(() => {
    cleanup = useTempData();
  });
  afterEach(() => cleanup());

  it('lists every book with availability', () => {
    const books = bookService.listBooks();
    assert.equal(books.length, 20);
    assert.ok(books.every((book) => typeof book.available === 'number'));
  });

  it('searches titles case-insensitively', () => {
    const results = bookService.listBooks({ q: 'dUnE' });
    assert.deepEqual(results.map((book) => book.id), ['b011']);
  });

  it('searches authors', () => {
    const results = bookService.listBooks({ q: 'le guin' });
    assert.deepEqual(results.map((book) => book.id), ['b001', 'b004']);
  });

  it('returns an empty list when nothing matches', () => {
    assert.deepEqual(bookService.listBooks({ q: 'zzzz' }), []);
  });

  it('reports zero copies available when all are on loan', () => {
    const book = bookService.getBook('b003');
    assert.equal(book.copies, 1);
    assert.equal(book.available, 0);
  });

  it('throws NotFoundError for an unknown book', () => {
    assert.throws(() => bookService.getBook('b999'), { name: 'NotFoundError', status: 404 });
  });

  it('adds a book with the next id', () => {
    const book = bookService.addBook({
      title: '  Braiding Sweetgrass ',
      author: 'Robin Wall Kimmerer',
      isbn: '978-1-57131-356-0',
      year: 2013,
      copies: 2,
    });
    assert.equal(book.id, 'b021');
    assert.equal(book.title, 'Braiding Sweetgrass');
    assert.equal(book.isbn, '9781571313560');
    assert.equal(book.available, 2);
    assert.equal(bookService.listBooks().length, 21);
  });

  it('rejects a book without a title', () => {
    assert.throws(() => bookService.addBook({ author: 'Someone' }), {
      name: 'ValidationError',
      status: 400,
    });
  });

  it('rejects a duplicate ISBN', () => {
    assert.throws(
      () => bookService.addBook({ title: 'Dune again', author: 'Frank Herbert', isbn: '9780441172719' }),
      { name: 'ConflictError', status: 409 }
    );
  });
});
