const { Router } = require('express');
const books = require('./books');
const loans = require('./loans');

const router = Router();

router.use('/books', books);
router.use('/loans', loans);

module.exports = router;
