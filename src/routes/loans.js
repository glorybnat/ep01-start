const { Router } = require('express');
const loanService = require('../services/loanService');

const router = Router();

router.get('/', (req, res) => {
  res.json(loanService.listLoans({ status: req.query.status }));
});

router.post('/', (req, res) => {
  res.status(201).json(loanService.borrowBook(req.body));
});

router.post('/:id/return', (req, res) => {
  res.json(loanService.returnBook(req.params.id));
});

module.exports = router;
