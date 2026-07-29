const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['welcome', 'promotion', 'transaction'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  dismissed: { type: Boolean, default: false },
  tokenId: { type: Number },
  txHash: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
