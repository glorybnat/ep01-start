const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { useTempData } = require('./helpers');
const memberService = require('../src/services/memberService');

describe('memberService', () => {
  let cleanup;
  beforeEach(() => {
    cleanup = useTempData();
  });
  afterEach(() => cleanup());

  it('lists all members', () => {
    assert.equal(memberService.listMembers().length, 10);
  });

  it('shows active loans on the member detail', () => {
    const detail = memberService.getMemberDetail('m004', '2026-10-17');
    assert.equal(detail.name, 'Tomás Herrera');
    assert.deepEqual(detail.activeLoans.map((loan) => loan.loanId).sort(), ['l010', 'l012']);
    const beloved = detail.activeLoans.find((loan) => loan.loanId === 'l010');
    assert.equal(beloved.title, 'Beloved');
    assert.equal(beloved.daysOverdue, 5);
  });

  it('totals fees charged on returned loans', () => {
    const detail = memberService.getMemberDetail('m004', '2026-10-17');
    assert.equal(detail.lateFeesCharged, 125);
    assert.equal(detail.lateFeesChargedFormatted, '$1.25');
  });

  it('shows no fees for a member with a clean record', () => {
    const detail = memberService.getMemberDetail('m009', '2026-10-17');
    assert.equal(detail.lateFeesCharged, 0);
    assert.equal(detail.lateFeesChargedFormatted, '$0.00');
    assert.equal(detail.activeLoans[0].daysOverdue, 0);
  });

  it('throws NotFoundError for an unknown member', () => {
    assert.throws(() => memberService.getMemberDetail('m999'), { name: 'NotFoundError' });
  });
});
