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
