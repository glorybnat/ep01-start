const store = require('./jsonStore');

const COLLECTION = 'loans';

function findAll() {
  return store.readAll(COLLECTION);
}

function findById(id) {
  return findAll().find((loan) => loan.id === id) || null;
}

function findByMember(memberId) {
  return findAll().filter((loan) => loan.memberId === memberId);
}

function findActive() {
  return findAll().filter((loan) => loan.returnedOn === null);
}

function countActiveByMember(memberId) {
  return findActive().filter((loan) => loan.memberId === memberId).length;
}

function countActiveByBook(bookId) {
  return findActive().filter((loan) => loan.bookId === bookId).length;
}

function insert(data) {
  const loans = findAll();
  const loan = { id: store.nextId('l', loans), ...data };
  loans.push(loan);
  store.writeAll(COLLECTION, loans);
  return loan;
}

function update(id, changes) {
  const loans = findAll();
  const index = loans.findIndex((loan) => loan.id === id);
  if (index === -1) return null;
  loans[index] = { ...loans[index], ...changes };
  store.writeAll(COLLECTION, loans);
  return loans[index];
}

module.exports = {
  findAll,
  findById,
  findByMember,
  findActive,
  countActiveByMember,
  countActiveByBook,
  insert,
  update,
};
