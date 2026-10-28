const bookRepository = require('../data/bookRepository');
const memberRepository = require('../data/memberRepository');
const loanRepository = require('../data/loanRepository');
const { daysLate } = require('./loanService');
const { today } = require('../utils/dates');

// Active loans past their due date, worst offenders first.
function getOverdueLoans(asOf = today()) {
  const books = new Map(bookRepository.findAll().map((book) => [book.id, book]));
  const members = new Map(memberRepository.findAll().map((member) => [member.id, member]));

  return loanRepository
    .findActive()
    .filter((loan) => loan.dueOn < asOf)
    .map((loan) => ({
      loanId: loan.id,
      memberId: loan.memberId,
      memberName: members.get(loan.memberId)?.name ?? 'Unknown member',
      bookId: loan.bookId,
      title: books.get(loan.bookId)?.title ?? 'Unknown book',
      dueOn: loan.dueOn,
      daysOverdue: daysLate(loan, asOf),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// Borrow counts include returned loans. Ties are broken by title.
function getMostBorrowed(limit = 5) {
  const counts = new Map();
  for (const loan of loanRepository.findAll()) {
    counts.set(loan.bookId, (counts.get(loan.bookId) || 0) + 1);
  }

  return bookRepository
    .findAll()
    .filter((book) => counts.has(book.id))
    .map((book) => ({
      bookId: book.id,
      title: book.title,
      author: book.author,
      timesBorrowed: counts.get(book.id),
    }))
    .sort((a, b) => b.timesBorrowed - a.timesBorrowed || a.title.localeCompare(b.title))
    .slice(0, limit);
}

module.exports = { getOverdueLoans, getMostBorrowed };
