const store = require('./jsonStore');

const COLLECTION = 'members';

function findAll() {
  return store.readAll(COLLECTION);
}

function findById(id) {
  return findAll().find((member) => member.id === id) || null;
}

module.exports = { findAll, findById };
