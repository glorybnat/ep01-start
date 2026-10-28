# Plan: loan renewal

Goal: a member can renew an active loan once; renewal extends dueOn by config.loanPeriodDays; overdue loans cannot be renewed.
Acceptance: `npm test` passes; renewal behaviour covered by tests; POST /loans/:id/renew works; README documents it.

## Steps
- [x] 1. (sonnet) Service + tests — src/services/loanService.js, test/loanService.test.js
  - Add `renewLoan(loanId, asOf = today())`, export it. Pattern: returnBook (loanService.js:62-72).
  - Checks in order, all via loanRepository.findById/update and errors from utils/errors:
    1. no loan -> NotFoundError(`Loan ${loanId} not found`)
    2. loan.returnedOn set -> ConflictError (not active)
    3. daysOverdue(loan, asOf) > 0 -> ConflictError (overdue; renewing ON the due date is allowed)
    4. (loan.renewals ?? 0) >= 1 -> ConflictError (already renewed)
  - Success: loanRepository.update(loanId, { dueOn: addDays(loan.dueOn, config.loanPeriodDays), renewals: (loan.renewals ?? 0) + 1 }); return describeLoan(updated).
  - borrowBook: add `renewals: 0` to the inserted loan. Legacy loans in data/loans.json lack the field; treat missing as 0, do not edit seed data.
  - Tests (node:test style of existing file, injected dates, useTempData): extends dueOn by loanPeriodDays; renewals becomes 1; second renewal rejected; overdue rejected (asOf = dueOn + 1); renew on dueOn day allowed; returned loan rejected; unknown id -> NotFoundError.
  - Done-check: `npm test` all green; do not touch routes or README.
- [ ] 2. (sonnet) Route — src/routes/loans.js: `POST /:id/renew` calling loanService.renewLoan(req.params.id); return 200 + loan. Add api.test.js cases (200, 404, 409). Done-check: `npm test`.
- [ ] 3. (haiku) README — Endpoints (README.md:38) add POST /loans/:id/renew; Lending rules (README.md:56) add renewal rules. Done-check: read diff.
- [ ] 4. (sonnet checker) `npm test` + diff review against this file.

## Decisions
- Renewal count stored as `renewals` on the loan; missing = 0.
- New due date = old dueOn + loanPeriodDays (not today + period).
- Overdue = daysOverdue > 0, same helper as fees.
- All rejections are 409 ConflictError except unknown id (404).

## Risks
- feeService.js:6 hardcodes borrowedOn + 7 for late fees, so renewal does not change fees. Out of scope; flag to user.
- Adding `renewals: 0` may break tests that deepEqual a loan; fix the test expectation if so.
