const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { useTempData } = require('./helpers');
const reportService = require('../src/services/reportService');

describe('reportService', () => {
  let cleanup;
  beforeEach(() => {
    cleanup = useTempData();
  });
  afterEach(() => cleanup());

  it('lists overdue loans, most overdue first', () => {
    const overdue = reportService.getOverdueLoans('2026-10-17');
    assert.deepEqual(overdue.map((loan) => loan.loanId), ['l009', 'l010', 'l012', 'l011']);
    assert.equal(overdue[0].daysOverdue, 9);
    assert.equal(overdue[0].memberName, 'Lucas Ferreira');
  });

  it('does not list loans that are not yet due', () => {
    assert.equal(reportService.getOverdueLoans('2026-10-01').length, 0);
  });

  it('ranks books by how often they were borrowed', () => {
    const top = reportService.getMostBorrowed(3);
    assert.equal(top.length, 3);
    assert.equal(top[0].bookId, 'b001');
    assert.equal(top[0].timesBorrowed, 3);
  });

  it('breaks ties alphabetically by title', () => {
    const top = reportService.getMostBorrowed(3);
    assert.deepEqual(top.slice(1).map((entry) => entry.title), ['Dune', 'Things Fall Apart']);
  });
});
