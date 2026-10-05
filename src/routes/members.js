const { Router } = require('express');
const memberService = require('../services/memberService');

const router = Router();

router.get('/', (req, res) => {
  res.json(memberService.listMembers());
});

router.get('/:id', (req, res) => {
  res.json(memberService.getMemberDetail(req.params.id));
});

module.exports = router;
