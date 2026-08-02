const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false }, // now optional — Google users won't have one
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);    