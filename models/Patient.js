const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  authUid: { type: String, index: true, sparse: true },
  email: { type: String, lowercase: true, index: true, sparse: true },
  photoURL: { type: String },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0, max: 150 },
  symptoms: { type: String, required: true, trim: true },
  isWaiting: { type: Boolean, default: true },
  socketId: { type: String, index: true },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);


