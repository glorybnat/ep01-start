const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { useTempData } = require('./helpers');
const config = require('../src/config');
const loanService = require('../src/services/loanService');
const bookService = require('../src/services/bookService');
const loanRepository = require('../src/data/loanRepository');
const { addDays } = require('../src/utils/dates');

describe('loanService', () => {
  let cleanup;
  beforeEach(() => {
    cleanup = useTempData();
  });
  afterEach(() => cleanup());

  describe('checkOut', () => {
    it('creates a loan due after the configured loan period', () => {
      const loan = loanService.checkOut({ memberId: 'm005', bookId: 'b005' }, '2026-10-17');
      assert.equal(loan.id, 'l016');
      assert.equal(loan.dueOn, addDays('2026-10-17', config.loanPeriodDays));
      assert.equal(loan.returnedOn, null);
      assert.equal(bookService.getBook('b005').available, 1);
    });

    it('refuses a book with no copies left', () => {
      assert.throws(
        () => loanService.checkOut({ memberId: 'm001', bookId: 'b003' }, '2026-10-17'),
        { name: 'ConflictError', status: 409 }
      );
    });

    it('refuses a member who is at the active loan limit', () => {
      // m004 already has two active loans in the seed data.
      loanService.checkOut({ memberId: 'm004', bookId: 'b005' }, '2026-10-17');
      assert.throws(
        () => loanService.checkOut({ memberId: 'm004', bookId: 'b007' }, '2026-10-17'),
        { name: 'ConflictError', message: /already has 3 active loans/ }
      );
    });

    it('rejects unknown members and books', () => {
      assert.throws(() => loanService.checkOut({ memberId: 'm999', bookId: 'b001' }), {
        name: 'NotFoundError',
      });
      assert.throws(() => loanService.checkOut({ memberId: 'm001', bookId: 'b999' }), {
        name: 'NotFoundError',
      });
    });

    it('rejects a request with missing fields', () => {
      assert.throws(() => loanService.checkOut({ memberId: 'm001' }), {
        name: 'ValidationError',
      });
    });
  });

  describe('checkIn', () => {
    it('charges no fee when the book comes back early', () => {
      const loan = loanService.checkOut({ memberId: 'm005', bookId: 'b005' }, '2026-10-01');
      const returned = loanService.checkIn(loan.id, '2026-10-04');
      assert.equal(returned.returnedOn, '2026-10-04');
      assert.equal(returned.lateFee, 0);
    });

    it('charges and stores a fee for a late return', () => {
      const returned = loanService.checkIn('l009', '2026-10-17');
      assert.ok(returned.lateFee > 0);
      assert.match(returned.lateFeeFormatted, /^\$\d+\.\d{2}$/);
      assert.equal(loanRepository.findById('l009').lateFee, returned.lateFee);
    });

    it('makes the copy available again', () => {
      assert.equal(bookService.getBook('b003').available, 0);
      loanService.checkIn('l009', '2026-10-17');
      assert.equal(bookService.getBook('b003').available, 1);
    });

    it('refuses to return the same loan twice', () => {
      assert.throws(() => loanService.checkIn('l001'), { name: 'ConflictError', status: 409 });
    });

    it('throws NotFoundError for an unknown loan', () => {
      assert.throws(() => loanService.checkIn('l999'), { name: 'NotFoundError', status: 404 });
    });
  });

  describe('renew', () => {
    function borrow() {
      return loanService.checkOut({ memberId: 'm005', bookId: 'b005' }, '2026-10-01');
    }

    it('extends the due date by the loan period and counts the renewal', () => {
      const loan = borrow();
      const renewed = loanService.renew(loan.id, '2026-10-02');
      assert.equal(renewed.dueOn, addDays(loan.dueOn, config.loanPeriodDays));
      assert.equal(renewed.renewals, 1);
      assert.equal(loanRepository.findById(loan.id).renewals, 1);
    });

    it('refuses a second renewal', () => {
      const loan = borrow();
      loanService.renew(loan.id, '2026-10-02');
      assert.throws(() => loanService.renew(loan.id, '2026-10-03'), {
        name: 'ConflictError',
        status: 409,
      });
    });

    it('refuses an overdue loan', () => {
      const loan = borrow();
      assert.throws(() => loanService.renew(loan.id, addDays(loan.dueOn, 1)), {
        name: 'ConflictError',
        status: 409,
      });
    });

    it('allows renewing on the due date', () => {
      const loan = borrow();
      const renewed = loanService.renew(loan.id, loan.dueOn);
      assert.equal(renewed.renewals, 1);
    });

    it('refuses a returned loan', () => {
      assert.throws(() => loanService.renew('l001', '2026-10-17'), {
        name: 'ConflictError',
        status: 409,
      });
    });

    it('throws NotFoundError for an unknown loan', () => {
      assert.throws(() => loanService.renew('l999'), { name: 'NotFoundError', status: 404 });
    });
  });

  describe('list', () => {
    it('filters by status', () => {
      assert.equal(loanService.list().length, 15);
      assert.equal(loanService.list({ status: 'active' }).length, 7);
      assert.equal(loanService.list({ status: 'returned' }).length, 8);
    });

    it('rejects an unknown status', () => {
      assert.throws(() => loanService.list({ status: 'lost' }), { name: 'ValidationError' });
    });
  });
});
