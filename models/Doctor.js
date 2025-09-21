const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  authUid: { type: String, index: true, sparse: true },
  email: { type: String, lowercase: true, index: true, sparse: true },
  photoURL: { type: String },
  name: { type: String, required: true, trim: true },
  specialization: { type: String, required: true, trim: true },
  isOnline: { type: Boolean, default: true },
  socketId: { type: String, index: true },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);


