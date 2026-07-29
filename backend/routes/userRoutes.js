const express = require('express');
const { linkWallet, unlinkWallet } = require('../controllers/userController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.patch('/wallet', requireAuth, linkWallet);
router.delete('/wallet', requireAuth, unlinkWallet);

module.exports = router;
