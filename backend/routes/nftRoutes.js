const express = require('express');
const { uploadTicket } = require('../controllers/nftController');

const router = express.Router();

router.post('/pinata/upload-ticket', uploadTicket);

module.exports = router;
