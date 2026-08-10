const bcrypt = require('bcrypt');
const User = require('../models/user');

const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require('../utils/GenerateTokens');


const sendRefreshCookie = (res,token) => {
  res.cookie('refreshToken', token,{
    httpOnly: true,
    secure:false,      // true in production (HTTPS)
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

 

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    const user = await User.create({ name, email, password: hashedPassword, role });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    sendRefreshCookie(res,refreshToken);

    res.status(201).json({
       accessToken,
       user: { id: user._id, name: user.name, email: user.email, role: user.role } 
      });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

   
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    sendRefreshCookie(res,refreshToken);

    res.json({
       accessToken,
       user: { id: user._id, name: user.name, email: user.email, role: user.role }
       });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// NEW — this replaces what sessions gave you for free
const refresh = (req,res) =>{
  const token = req.cookies.refreshToken;
  if(!token) return res.status(401).json({message:"No refresh token provided"});

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if(err) return res.status(403).json({message:"Invalid refresh token"});

    // Note: role isn't in the refresh token payload, so a real app would
    // re-fetch the user here to get their current role before issuing
    // a new access token — cheap and avoids serving a stale role.
    User.findById(decoded.userId).then(user => {
      if(!user) return res.status(404).json({message:"User not found"});
      const newAccessToken = generateAccessToken(user);
      res.json({accessToken:newAccessToken});
    });
})
}

const logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
};

const me = async (req, res) => {
    // req.user is set by the requireAuth middleware after verifying the access token
  res.json(req.user);
};

const listUsers = async (req, res) => {
  try {
    const isOwnerOrAdmin = req.user.role === 'owner' || req.user.role === 'admin';
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({}, 'name email role createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const isOwnerOrAdmin = req.user.role === 'owner' || req.user.role === 'admin';
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { role } = req.body;
    if (!['member', 'admin', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    if (userToUpdate.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can modify owner roles' });
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    res.json({ message: 'User role updated successfully', user: { id: userToUpdate._id, name: userToUpdate.name, email: userToUpdate.email, role: userToUpdate.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const isOwnerOrAdmin = req.user.role === 'owner' || req.user.role === 'admin';
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });

    if (userToDelete.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can delete other owners' });
    }

    await userToDelete.deleteOne();
    res.json({ message: 'User deleted successfully', userId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
  refresh,
  listUsers,
  updateUserRole,
  deleteUser
}