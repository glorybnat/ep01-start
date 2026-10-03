const config = require('../config');
const { addDays, daysBetween } = require('../utils/dates');

// Late fee in cents for a loan returned (or about to be returned) on `returnedOn`.
function calculateLateFee(loan, returnedOn) {
  const dueOn = addDays(loan.borrowedOn, 7);
  const daysLate = Math.max(0, daysBetween(dueOn, returnedOn));
  return Math.min(daysLate * config.lateFeePerDay, config.maxLateFee);
}

module.exports = { calculateLateFee };
