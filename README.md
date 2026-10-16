# Shelf

Shelf is a small library lending API. Staff manage books and members, members
borrow and return books, and loans that come back late are charged a fee.

It is a plain Express app that stores its data in JSON files, so there is no
database to install.

## Setup

You need Node.js 20 or newer.

```sh
npm install
```

## Run

```sh
npm start
```

The API listens on http://localhost:3000. Set `PORT` to use another port.

## Test

```sh
npm test
```

Tests use Node's built-in test runner and work on a temporary copy of `data/`,
so they never change the seed files.

## Endpoints

| Method | Path                      | Description                                        |
| ------ | ------------------------- | -------------------------------------------------- |
| GET    | `/health`                 | Liveness check                                     |
| GET    | `/books`                  | List books; `?q=` searches title and author        |
| GET    | `/books/:id`              | One book, with copies available                    |
| POST   | `/books`                  | Add a book (`title`, `author`, optional `isbn`, `year`, `copies`) |
| GET    | `/members`                | List members                                       |
| GET    | `/members/:id`            | Member with active loans and late fees             |
| GET    | `/loans`                  | List loans; `?status=active` or `?status=returned` |
| POST   | `/loans`                  | Borrow a book (`memberId`, `bookId`)               |
| POST   | `/loans/:id/return`       | Return a book and charge any late fee              |
| GET    | `/reports/overdue`        | Active loans past their due date                   |
| GET    | `/reports/most-borrowed`  | Most borrowed books; `?limit=` (default 5)         |

Errors come back as JSON: `{ "error": "message" }` with a 400, 404 or 409 status.

## Lending rules

- Books are lent for 14 days.
- A member can have at most 3 books out at once.
- A loan can only be started while a copy is available.
- Late fees are $0.25 for each day past the due date, capped at $15.00 per loan.
  The fee is calculated when the book is returned.

## Data

Records live in `data/books.json`, `data/members.json` and `data/loans.json`.
Set `SHELF_DATA_DIR` to point the app at a different folder. Money is stored in
cents.
