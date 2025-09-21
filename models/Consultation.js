const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  senderType: { type: String, enum: ['doctor', 'patient'], required: true },
  senderId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const consultationSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  status: { type: String, enum: ['waiting', 'active', 'completed', 'cancelled'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  messages: { type: [messageSchema], default: [] },
  videoCallActive: { type: Boolean, default: false },
  videoCallStartedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Consultation', consultationSchema);


