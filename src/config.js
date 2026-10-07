const path = require('path');

module.exports = {
  port: Number(process.env.PORT) || 3000,

  // Directory holding books.json, members.json and loans.json.
  dataDir: process.env.SHELF_DATA_DIR || path.join(__dirname, '..', 'data'),

  // Days a member can keep a book before it is due.
  loanPeriodDays: 14,

  // Most books a member can have out at the same time.
  maxActiveLoans: 3,

  // Late fees are stored in cents.
  lateFeePerDay: 25,
  maxLateFee: 1500,
};
