const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    const user = await User.create({ name, email, password: hashedPassword, role });

    req.session.userId = user._id;
    req.session.role = user.role;

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // This is the key line — Express writes a session record and
    // sends back a Set-Cookie header with the session ID
    req.session.userId = user._id;
    req.session.role = user.role;

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Could not log out' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
};

exports.me = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ id: user._id, userId: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};