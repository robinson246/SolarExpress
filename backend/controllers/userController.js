const User = require('../models/User');

function isValidEthAddress(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

async function linkWallet(req, res) {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidEthAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    const normalized = walletAddress.toLowerCase();

    // Check if another account already has this wallet linked
    const existing = await User.findOne({ walletAddress: normalized });
    if (existing && existing._id.toString() !== req.user.id.toString()) {
      return res.status(409).json({ error: 'This wallet is already linked to another account' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress: normalized },
      { new: true, runValidators: true },
    ).select('email username walletAddress profileImage role createdAt');

    res.json({ user });
  } catch (err) {
    console.error('Link wallet error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function unlinkWallet(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress: null },
      { new: true },
    ).select('email username walletAddress profileImage role createdAt');

    res.json({ user });
  } catch (err) {
    console.error('Unlink wallet error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { linkWallet, unlinkWallet };
