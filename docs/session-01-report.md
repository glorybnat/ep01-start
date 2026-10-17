# Session 01 report: exploring Shelf

Model answer for the Episode 1 lab. Every claim names the file it comes from.

## What the project does

Shelf is a library lending API built on Express (`package.json:16`, entry point `src/server.js`).
Staff add and search books (`src/routes/books.js`), members borrow and return books
(`src/routes/loans.js`), and loans returned after their due date are charged a late fee
(`src/services/feeService.js`). Reports list overdue loans and the most borrowed books
(`src/routes/reports.js`). Data lives in JSON files, not a database (`src/data/jsonStore.js`,
`data/*.json`). Tests use Node's built-in runner (`package.json:9`, `test/`).

## Folder map

| Path | Role |
| --- | --- |
| `src/server.js` | Starts the HTTP server on `config.port` (line 6) |
| `src/app.js` | Builds the Express app: JSON body parsing (line 7), `/health`, routes (line 13), error handler (line 15) |
| `src/config.js` | Loan period, max active loans, fee per day, fee cap, data directory |
| `src/routes/` | HTTP layer only: `books.js`, `members.js`, `loans.js`, `reports.js`, mounted in `index.js` |
| `src/services/` | Business rules: `bookService.js`, `memberService.js`, `loanService.js`, `feeService.js`, `reportService.js` |
| `src/data/` | Repositories over JSON files: `bookRepository.js`, `memberRepository.js`, `loanRepository.js`, plus `jsonStore.js` |
| `src/utils/` | `dates.js`, `validation.js`, `money.js`, `errors.js` |
| `src/middleware/errorHandler.js` | Turns thrown errors into JSON responses |
| `data/` | Seed records: `books.json`, `members.json`, `loans.json` |
| `test/` | Tests per service plus `api.test.js`; `helpers.js` copies `data/` to a temp folder |

## Trace: returning a book (`POST /loans/:id/return`)

1. `src/app.js:13` mounts the router; `src/routes/index.js:11` sends `/loans` to `src/routes/loans.js`.
2. `src/routes/loans.js:14-16` handles `POST /:id/return` and calls `loanService.returnBook(req.params.id)`.
3. `src/services/loanService.js:62` `returnBook` loads the loan through `loanRepository.findById`
   (`src/data/loanRepository.js:9`) and throws `NotFoundError` (404) or `ConflictError` (409, already returned).
4. `src/services/loanService.js:69` calls `calculateLateFee(loan, returnedOn)` in `src/services/feeService.js:5`.
   That function counts days past the due date, multiplies by `config.lateFeePerDay`
   (`src/config.js:16`) and caps the result at `config.maxLateFee` (`src/config.js:17`).
5. `src/services/loanService.js:70` saves `returnedOn` and `lateFee` through `loanRepository.update`
   (`src/data/loanRepository.js:37`).
6. `loanRepository.update` calls `store.writeAll` (`src/data/jsonStore.js:19`), which writes
   `data/loans.json` through a temp file and a rename.
7. `src/services/loanService.js:71` adds `lateFeeFormatted` via `describeLoan` (line 18) and
   `formatCents` (`src/utils/money.js`); the route returns it as JSON (`src/routes/loans.js:15`).
8. Errors thrown on the way are converted to a JSON status by `src/middleware/errorHandler.js`.

The fee later appears on `GET /members/:id`, summed in `src/services/memberService.js` as `lateFeesCharged`.
Tests for this path: `test/loanService.test.js` (`returnBook` block) and `test/api.test.js`.

## Example tool calls

| # | Goal | Tool call | Category |
| --- | --- | --- | --- |
| 1 | See the top level | `ls` on the repo root | read |
| 2 | Learn scripts and dependencies | Read `package.json` | read |
| 3 | Find the entry point | Read `src/server.js` | read |
| 4 | See how routes are mounted | Read `src/routes/index.js` | read |
| 5 | Find every use of the fee function | Grep `calculateLateFee` in `src/` | search |
| 6 | Find where the loan period is used | Grep `loanPeriodDays` in `src/` and `README.md` | search |
| 7 | Find all route files | Glob `src/routes/*.js` | search |
| 8 | Read the return logic | Read `src/services/loanService.js` | read |
| 9 | Read the fee rule | Read `src/services/feeService.js` | read |
| 10 | Add a comment to the entry file | Edit `src/server.js` | edit |
| 11 | Run the test suite | `npm test` | run |
| 12 | Start the API | `npm start` | run |
| 13 | Try an endpoint | `curl localhost:3000/reports/overdue` | run |

## Inconsistency found

The loan period is 14 days in `src/config.js:10` (`loanPeriodDays: 14`) and in `README.md:54`
("Books are lent for 14 days"). New loans get their due date from that setting
(`src/services/loanService.js:55`), and the seed loans in `data/loans.json` are due 14 days after
they are borrowed (for example `l009` at line 79). But `src/services/feeService.js:6` computes the
fee from `addDays(loan.borrowedOn, 7)`: a hardcoded 7-day period.

Effect: a book returned on day 10 is not overdue by the due date or the overdue report
(`src/services/reportService.js`, which uses `loan.dueOn`), yet it is charged three days of fees.
On the seed data, `l009` is 9 days past its due date (`GET /reports/overdue`) but returning it
charges 16 days: $4.00 instead of $2.25.

Verdict: a real bug in `src/services/feeService.js`, not a documentation error. The config and README
agree with each other and with the data. The fix is to compute the fee from `loan.dueOn`
(or `config.loanPeriodDays`) instead of the literal 7. The existing tests in `test/feeService.test.js`
check only the cap, the daily rate and no-fee returns, so they do not catch it; a test with an exact
expected fee would.
