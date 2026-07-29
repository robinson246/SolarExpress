const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined. Set it in backend/.env');
}

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(payload.id).select('email username walletAddress profileImage role');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = { id: user._id, email: user.email, walletAddress: user.walletAddress || null };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
