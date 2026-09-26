const { ValidationError } = require('./errors');

function requireString(value, field, maxLength = 200) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
}

function parseInteger(value, field, { min, max, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback;
    throw new ValidationError(`${field} is required`);
  }
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new ValidationError(`${field} must be a whole number`);
  }
  if (min !== undefined && number < min) {
    throw new ValidationError(`${field} must be at least ${min}`);
  }
  if (max !== undefined && number > max) {
    throw new ValidationError(`${field} must be at most ${max}`);
  }
  return number;
}

function normalizeIsbn(value) {
  if (value === undefined || value === null || value === '') return null;
  const digits = String(value).replace(/[-\s]/g, '');
  if (!/^(\d{10}|\d{13})$/.test(digits)) {
    throw new ValidationError('isbn must have 10 or 13 digits');
  }
  return digits;
}

function validateNewBook(body) {
  const input = body || {};
  const maxYear = new Date().getFullYear() + 1;
  return {
    title: requireString(input.title, 'title'),
    author: requireString(input.author, 'author'),
    isbn: normalizeIsbn(input.isbn),
    year: parseInteger(input.year, 'year', { min: 1000, max: maxYear, fallback: null }),
    copies: parseInteger(input.copies, 'copies', { min: 1, max: 50, fallback: 1 }),
  };
}

module.exports = { requireString, parseInteger, normalizeIsbn, validateNewBook };
