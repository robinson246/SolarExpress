const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifs);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true },
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.dismissPromotion = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, type: 'promotion' },
      { dismissed: true },
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { type, message, tokenId, txHash } = req.body;
    const notif = await Notification.create({ userId: req.user.id, type, message, tokenId, txHash });
    res.status(201).json(notif);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
