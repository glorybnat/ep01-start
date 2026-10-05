const bookRepository = require('../data/bookRepository');
const memberRepository = require('../data/memberRepository');
const loanRepository = require('../data/loanRepository');
const { calculateLateFee } = require('./feeService');
const { daysOverdue } = require('./loanService');
const { today } = require('../utils/dates');
const { formatCents } = require('../utils/money');
const { NotFoundError } = require('../utils/errors');

function listMembers() {
  return memberRepository.findAll();
}

// Member plus current loans. Fees already charged on returned loans are
// totalled separately from the fee an overdue loan would cost right now.
function getMemberDetail(id, asOf = today()) {
  const member = memberRepository.findById(id);
  if (!member) throw new NotFoundError(`Member ${id} not found`);

  const loans = loanRepository.findByMember(id);
  const booksById = new Map(bookRepository.findAll().map((book) => [book.id, book]));

  const activeLoans = loans
    .filter((loan) => loan.returnedOn === null)
    .map((loan) => {
      const accruedFee = calculateLateFee(loan, asOf);
      return {
        loanId: loan.id,
        bookId: loan.bookId,
        title: booksById.get(loan.bookId)?.title ?? 'Unknown book',
        borrowedOn: loan.borrowedOn,
        dueOn: loan.dueOn,
        daysOverdue: daysOverdue(loan, asOf),
        accruedFee,
        accruedFeeFormatted: formatCents(accruedFee),
      };
    });

  const lateFeesCharged = loans.reduce((sum, loan) => sum + loan.lateFee, 0);

  return {
    ...member,
    activeLoans,
    lateFeesCharged,
    lateFeesChargedFormatted: formatCents(lateFeesCharged),
  };
}

module.exports = { listMembers, getMemberDetail };
