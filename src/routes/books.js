const { Router } = require('express');
const bookService = require('../services/bookService');

const router = Router();

router.get('/', (req, res) => {
  res.json(bookService.listBooks({ q: req.query.q }));
});

router.get('/:id', (req, res) => {
  res.json(bookService.getBook(req.params.id));
});

router.post('/', (req, res) => {
  res.status(201).json(bookService.addBook(req.body));
});

module.exports = router;
