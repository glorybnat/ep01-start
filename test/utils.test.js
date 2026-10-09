const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { addDays, daysBetween, isValidDate } = require('../src/utils/dates');
const { formatCents } = require('../src/utils/money');
const { parseInteger, validateNewBook } = require('../src/utils/validation');

describe('dates', () => {
  it('adds days across month and year boundaries', () => {
    assert.equal(addDays('2026-10-25', 10), '2026-11-04');
    assert.equal(addDays('2026-12-30', 3), '2027-01-02');
  });

  it('counts days between two dates', () => {
    assert.equal(daysBetween('2026-10-01', '2026-10-15'), 14);
    assert.equal(daysBetween('2026-10-15', '2026-10-01'), -14);
  });

  it('validates date strings', () => {
    assert.equal(isValidDate('2026-02-28'), true);
    assert.equal(isValidDate('2026-02-30'), false);
    assert.equal(isValidDate('yesterday'), false);
  });
});

describe('money', () => {
  it('formats cents as dollars', () => {
    assert.equal(formatCents(0), '$0.00');
    assert.equal(formatCents(5), '$0.05');
    assert.equal(formatCents(125), '$1.25');
    assert.equal(formatCents(1500), '$15.00');
  });
});

describe('validation', () => {
  it('parses integers with bounds and fallbacks', () => {
    assert.equal(parseInteger('7', 'n', { min: 1 }), 7);
    assert.equal(parseInteger(undefined, 'n', { fallback: 5 }), 5);
    assert.throws(() => parseInteger('1.5', 'n'), { name: 'ValidationError' });
    assert.throws(() => parseInteger('0', 'n', { min: 1 }), { name: 'ValidationError' });
  });

  it('applies defaults when validating a new book', () => {
    const book = validateNewBook({ title: 'A', author: 'B' });
    assert.equal(book.copies, 1);
    assert.equal(book.isbn, null);
    assert.equal(book.year, null);
  });

  it('rejects a malformed ISBN', () => {
    assert.throws(() => validateNewBook({ title: 'A', author: 'B', isbn: '123' }), {
      name: 'ValidationError',
    });
  });
});
