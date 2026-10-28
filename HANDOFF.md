# HANDOFF: loan renewal

## Goal
A member can renew an active loan once. Renewal extends `dueOn` by `config.loanPeriodDays` (14).
An overdue loan cannot be renewed. Work is split in three steps: service + tests, route, README.
Full step text and done-checks are in `PLAN.md` (step 1 is ticked).

## Done (step 1: service + tests)
- `src/services/loanService.js`
  - New `renewLoan(loanId, asOf = today())`, exported.
  - `borrowBook` now inserts `renewals: 0` on new loans.
- `test/loanService.test.js`: new `renewLoan` describe block with 6 tests (extend, second renewal
  rejected, overdue rejected, renew on due date allowed, returned rejected, unknown id).
- Verified: `npm test` gave 56 pass, 0 fail.

## Decisions (and why)
- Renewal count lives on the loan as `renewals`; a missing field counts as 0. This avoids editing
  the seed data in `data/loans.json`.
- New due date = old `dueOn` + loan period, not today + loan period. This matches "extends the due
  date" and means renewing early does not lose days.
- Overdue means `daysOverdue(loan, asOf) > 0`, the same helper the fees use. Renewing on the due
  date itself is allowed.
- Errors: unknown loan is `NotFoundError` (404). Returned, overdue and already-renewed are all
  `ConflictError` (409). This matches how `returnBook` already behaves.
- Checks run in this order: not found, returned, overdue, already renewed.

## Next step (step 2: route)
In `src/routes/loans.js` (currently GET `/`, POST `/`, POST `/:id/return`), add
`POST /:id/renew` calling `loanService.renewLoan(req.params.id)` and returning 200 with the loan.
Routes have no try/catch; Express 4 forwards thrown errors to `src/middleware/errorHandler.js`.
Add `test/api.test.js` cases for 200, 404 and 409 (overdue or already renewed).
Then step 3: README `Endpoints` (~line 38) and `Lending rules` (~line 56).

## Prove the current work
    cd /Users/glory/Documents/ep01-start && npm test

## Gotchas
- `src/services/feeService.js:6` hardcodes `borrowedOn + 7` for late fees instead of using `dueOn`,
  so renewing does not change late fees. Out of scope; raise it with the user.
- `public/styles.css` (modified) and `test.txt` (untracked) predate this work. Leave them out of
  any commit.
- Nothing is committed yet.
