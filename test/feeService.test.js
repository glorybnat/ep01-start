const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const { calculateLateFee } = require('../src/services/feeService');

describe('feeService', () => {
  const loan = (borrowedOn) => ({ borrowedOn });

  it('charges nothing when returned the day it was borrowed', () => {
    assert.equal(calculateLateFee(loan('2026-10-01'), '2026-10-01'), 0);
  });

  it('charges nothing for a return a few days after borrowing', () => {
    assert.equal(calculateLateFee(loan('2026-10-01'), '2026-10-04'), 0);
  });

  it('charges whole days at the configured daily rate', () => {
    const fee = calculateLateFee(loan('2026-09-01'), '2026-09-25');
    assert.ok(fee > 0);
    assert.equal(fee % config.lateFeePerDay, 0);
  });

  it('never exceeds the maximum fee', () => {
    assert.equal(calculateLateFee(loan('2025-01-01'), '2026-01-01'), config.maxLateFee);
  });

  it('grows the longer a book is kept', () => {
    const sooner = calculateLateFee(loan('2026-09-01'), '2026-09-25');
    const later = calculateLateFee(loan('2026-09-01'), '2026-09-28');
    assert.ok(later > sooner);
  });
});
