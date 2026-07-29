const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { JWT_SECRET } = require('../middleware/requireAuth');

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: COOKIE_MAX_AGE,
  path: '/',
};

function setTokenCookie(res, token) {
  res.cookie('token', token, COOKIE_OPTIONS);
}

async function generateOnboardingNotifications(userId) {
  // Welcome — only once per user
  const existingWelcome = await Notification.findOne({ userId, type: 'welcome' });
  if (!existingWelcome) {
    await Notification.create({
      userId,
      type: 'welcome',
      message: 'Welcome to SolarExpress! Explore the solar system, book your first trip, and start collecting NFT boarding passes.',
    });
  }

  // Active promotion — only if not already dismissed
  const activePromo = await Notification.findOne({ userId, type: 'promotion', dismissed: false });
  if (!activePromo) {
    await Notification.create({
      userId,
      type: 'promotion',
      message: '🚀 Limited time: 10% off tickets this week!',
    });
  }
}

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

async function signup(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase(), passwordHash });

    const token = generateToken(user);
    setTokenCookie(res, token);

    generateOnboardingNotifications(user._id).catch(err => console.error('Onboarding notification error:', err));

    res.status(201).json({ user: { id: user._id, email: user.email, walletAddress: null } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    generateOnboardingNotifications(user._id).catch(err => console.error('Onboarding notification error:', err));

    res.json({ user: { id: user._id, email: user.email, walletAddress: user.walletAddress || null } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function logout(_req, res) {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, logout, me };
