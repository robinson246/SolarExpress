const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined. Set it in backend/.env');
}

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth(req, res, next) {
  // 1. Try cookie (desktop browsers)
  const cookieToken = req.cookies.token;

  // 2. Try Authorization header (mobile / programmatic clients)
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  // 3. Try wallet address header (mobile fallback when cookies are blocked)
  const walletAddress = req.headers['x-wallet-address'];

  const token = cookieToken || headerToken;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id).select('email username walletAddress profileImage role');
      if (user) {
        req.user = { id: user._id, email: user.email, walletAddress: user.walletAddress || null };
        return next();
      }
    } catch {
      // Token invalid — fall through to wallet check
    }
  }

  // Wallet address fallback (mobile in-app browsers with cookie restrictions)
  if (walletAddress) {
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() }).select('email username walletAddress profileImage role');
    if (user) {
      req.user = { id: user._id, email: user.email, walletAddress: user.walletAddress || null };
      return next();
    }
    return res.status(401).json({ error: 'No account linked to this wallet. Sign in first.' });
  }

  return res.status(401).json({ error: 'Not authenticated' });
}

module.exports = { requireAuth, JWT_SECRET };