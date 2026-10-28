const config = require('../config');
const bookRepository = require('../data/bookRepository');
const memberRepository = require('../data/memberRepository');
const loanRepository = require('../data/loanRepository');
const { calculateLateFee } = require('./feeService');
const { today, addDays, daysBetween } = require('../utils/dates');
const { formatCents } = require('../utils/money');
const { requireString } = require('../utils/validation');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

const STATUSES = ['active', 'returned'];

function daysLate(loan, asOf = today()) {
  if (loan.returnedOn) return 0;
  return Math.max(0, daysBetween(loan.dueOn, asOf));
}

function present(loan) {
  return { ...loan, lateFeeFormatted: formatCents(loan.lateFee) };
}

function list({ status } = {}) {
  if (status !== undefined && !STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${STATUSES.join(', ')}`);
  }
  let loans = loanRepository.findAll();
  if (status === 'active') loans = loans.filter((loan) => loan.returnedOn === null);
  if (status === 'returned') loans = loans.filter((loan) => loan.returnedOn !== null);
  return loans.map(present);
}

function checkOut(input, borrowedOn = today()) {
  const body = input || {};
  const memberId = requireString(body.memberId, 'memberId');
  const bookId = requireString(body.bookId, 'bookId');

  const member = memberRepository.findById(memberId);
  if (!member) throw new NotFoundError(`Member ${memberId} not found`);
  const book = bookRepository.findById(bookId);
  if (!book) throw new NotFoundError(`Book ${bookId} not found`);

  if (loanRepository.countActiveByMember(memberId) >= config.maxActiveLoans) {
    throw new ConflictError(
      `${member.name} already has ${config.maxActiveLoans} active loans`
    );
  }
  if (loanRepository.countActiveByBook(bookId) >= book.copies) {
    throw new ConflictError(`No copies of "${book.title}" are available`);
  }

  const loan = loanRepository.insert({
    bookId,
    memberId,
    borrowedOn,
    dueOn: addDays(borrowedOn, config.loanPeriodDays),
    returnedOn: null,
    lateFee: 0,
    renewals: 0,
  });
  return present(loan);
}

function checkIn(loanId, returnedOn = today()) {
  const loan = loanRepository.findById(loanId);
  if (!loan) throw new NotFoundError(`Loan ${loanId} not found`);
  if (loan.returnedOn) {
    throw new ConflictError(`Loan ${loanId} was already returned on ${loan.returnedOn}`);
  }

  const lateFee = calculateLateFee(loan, returnedOn);
  const updated = loanRepository.update(loanId, { returnedOn, lateFee });
  return present(updated);
}

function renew(loanId, asOf = today()) {
  const loan = loanRepository.findById(loanId);
  if (!loan) throw new NotFoundError(`Loan ${loanId} not found`);
  if (loan.returnedOn) {
    throw new ConflictError(`Loan ${loanId} is not active; it was returned on ${loan.returnedOn}`);
  }
  if (daysLate(loan, asOf) > 0) {
    throw new ConflictError(`Loan ${loanId} is overdue and cannot be renewed`);
  }
  const renewals = loan.renewals ?? 0;
  if (renewals >= 1) {
    throw new ConflictError(`Loan ${loanId} has already been renewed`);
  }

  const updated = loanRepository.update(loanId, {
    dueOn: addDays(loan.dueOn, config.loanPeriodDays),
    renewals: renewals + 1,
  });
  return present(updated);
}

module.exports = { list, checkOut, checkIn, renew, daysLate };
