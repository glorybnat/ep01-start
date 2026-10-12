const { Router } = require('express');
const reportService = require('../services/reportService');
const { parseInteger } = require('../utils/validation');

const router = Router();

router.get('/overdue', (req, res) => {
  res.json(reportService.getOverdueLoans());
});

router.get('/most-borrowed', (req, res) => {
  const limit = parseInteger(req.query.limit, 'limit', { min: 1, max: 50, fallback: 5 });
  res.json(reportService.getMostBorrowed(limit));
});

module.exports = router;
