const { Router } = require('express');
const books = require('./books');
const members = require('./members');
const loans = require('./loans');

const router = Router();

router.use('/books', books);
router.use('/members', members);
router.use('/loans', loans);

module.exports = router;
