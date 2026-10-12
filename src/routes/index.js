const { Router } = require('express');
const books = require('./books');
const members = require('./members');
const loans = require('./loans');
const reports = require('./reports');

const router = Router();

router.use('/books', books);
router.use('/members', members);
router.use('/loans', loans);
router.use('/reports', reports);

module.exports = router;
