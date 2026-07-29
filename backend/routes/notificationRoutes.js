const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const notifController = require('../controllers/notificationController');

router.use(requireAuth);

router.get('/', notifController.getNotifications);
router.patch('/:id/read', notifController.markRead);
router.patch('/read-all', notifController.markAllRead);
router.patch('/:id/dismiss', notifController.dismissPromotion);
router.post('/', notifController.createNotification);

module.exports = router;
