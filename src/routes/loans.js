const { Router } = require('express');
const loanService = require('../services/loanService');

const router = Router();

router.get('/', (req, res) => {
  res.json(loanService.list({ status: req.query.status }));
});

router.post('/', (req, res) => {
  res.status(201).json(loanService.checkOut(req.body));
});

router.post('/:id/return', (req, res) => {
  res.json(loanService.checkIn(req.params.id));
});

module.exports = router;
