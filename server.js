const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Consultation = require('./models/Consultation');

// Connect to MongoDB (non-blocking)
connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from dist directory (React build)
app.use(express.static(path.join(__dirname, 'dist')));

app.use(express.json());

// Routes - serve React app for all routes except API endpoints
app.get('/status', async (req, res) => {
  try {
    const connectedDoctors = await Doctor.countDocuments({ isOnline: true });
    const waitingPatients = await Patient.countDocuments({ isWaiting: true });
    const activeConsultations = await Consultation.countDocuments({ status: 'active' });
    res.json({ connectedDoctors, waitingPatients, activeConsultations });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Patient joins
  socket.on('patient-join', async (data) => {
    try {
      const { name, age, symptoms } = data;
      const patient = await Patient.create({
        name, age, symptoms, isWaiting: true, socketId: socket.id, joinedAt: new Date(), lastActive: new Date()
      });

      console.log(`Patient ${name} joined and is waiting for a doctor`);

      // Notify all doctors about new patient
      io.to('doctors').emit('new-patient', {
        id: patient._id.toString(),
        name: patient.name,
        age: patient.age,
        symptoms: patient.symptoms,
        joinedAt: patient.joinedAt
      });

      // Confirm patient connection
      socket.emit('patient-confirmed', {
        message: 'You are now in the waiting room. A doctor will be with you shortly.',
        patientId: patient._id.toString()
      });
    } catch (e) {
      console.error('patient-join error', e);
      socket.emit('error', { message: 'Failed to join as patient' });
    }
  });

  // Doctor joins
  socket.on('doctor-join', async (data) => {
    try {
      const { name, specialization } = data;
      const doctor = await Doctor.create({
        name, specialization, isOnline: true, socketId: socket.id, joinedAt: new Date(), lastActive: new Date()
      });

      socket.join('doctors');

      console.log(`Doctor ${name} joined`);

      // Send waiting patients to the doctor
      const waiting = await Patient.find({ isWaiting: true }).sort({ joinedAt: 1 }).lean();
      const waitingPatientsList = waiting.map(p => ({
        id: p._id.toString(),
        name: p.name,
        age: p.age,
        symptoms: p.symptoms,
        joinedAt: p.joinedAt
      }));
      socket.emit('waiting-patients', waitingPatientsList);

      // Confirm doctor connection
      socket.emit('doctor-confirmed', {
        message: 'You are now online and can see waiting patients.',
        doctorId: doctor._id.toString()
      });
    } catch (e) {
      console.error('doctor-join error', e);
      socket.emit('error', { message: 'Failed to join as doctor' });
    }
  });

  // Doctor requests the latest waiting patients list
  socket.on('get-waiting-patients', async () => {
    try {
      const waiting = await Patient.find({ isWaiting: true }).sort({ joinedAt: 1 }).lean();
      const list = waiting.map(p => ({
        id: p._id.toString(),
        name: p.name,
        age: p.age,
        symptoms: p.symptoms,
        joinedAt: p.joinedAt
      }));
      socket.emit('waiting-patients', list);
    } catch (e) {
      console.error('get-waiting-patients error', e);
    }
  });

  // Doctor accepts a patient
  socket.on('accept-patient', async (patientId) => {
    try {
      const doctor = await Doctor.findOne({ socketId: socket.id });
      const patient = await Patient.findById(patientId);
      if (!doctor || !patient || !patient.isWaiting) return;

      patient.isWaiting = false;
      await patient.save();

      const consultation = await Consultation.create({
        doctor: doctor._id,
        patient: patient._id,
        status: 'active',
        startedAt: new Date(),
        messages: []
      });

      const consultationId = consultation._id.toString();
      const room = consultationId;

      // Join both to consultation room
      socket.join(room);
      if (patient.socketId) {
        io.to(patient.socketId).socketsJoin(room);
      }

      // Notify both parties
      socket.emit('consultation-started', {
        consultationId,
        patient: {
          id: patient._id.toString(),
          name: patient.name,
          age: patient.age,
          symptoms: patient.symptoms
        },
        message: `Consultation started with ${patient.name}`
      });

      if (patient.socketId) {
        io.to(patient.socketId).emit('consultation-started', {
          consultationId,
          doctor: {
            id: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization
          },
          message: `Dr. ${doctor.name} is now consulting with you`
        });
      }

      // Notify other doctors that patient is no longer waiting
      socket.to('doctors').emit('patient-accepted', patient._id.toString());

      console.log(`Doctor ${doctor.name} started consultation with patient ${patient.name}`);
    } catch (e) {
      console.error('accept-patient error', e);
    }
  });

  // Handle messages during consultation
  socket.on('send-message', async (data) => {
    try {
      const { consultationId, message, senderType } = data;
      const consultation = await Consultation.findById(consultationId);
      if (!consultation) return;
      const messageData = {
        text: message,
        senderType,
        senderId: socket.id,
        timestamp: new Date()
      };
      consultation.messages.push(messageData);
      await consultation.save();
      io.to(consultationId).emit('new-message', { id: Date.now(), ...messageData });
    } catch (e) {
      console.error('send-message error', e);
    }
  });

  // WebRTC signaling handlers
  socket.on('webrtc-offer', (data) => {
    const { consultationId, offer, senderType } = data;
    socket.to(consultationId).emit('webrtc-offer', { offer, senderType, senderId: socket.id });
  });

  socket.on('webrtc-answer', (data) => {
    const { consultationId, answer, senderType } = data;
    socket.to(consultationId).emit('webrtc-answer', { answer, senderType, senderId: socket.id });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { consultationId, candidate, senderType } = data;
    socket.to(consultationId).emit('webrtc-ice-candidate', { candidate, senderType, senderId: socket.id });
  });

  socket.on('start-video-call', async (data) => {
    try {
      const { consultationId, senderType } = data;
      await Consultation.findByIdAndUpdate(consultationId, { videoCallActive: true, videoCallStartedAt: new Date() });
      socket.to(consultationId).emit('video-call-started', { senderType, senderId: socket.id });
    } catch (e) {
      console.error('start-video-call error', e);
    }
  });

  socket.on('end-video-call', async (data) => {
    try {
      const { consultationId, senderType } = data;
      await Consultation.findByIdAndUpdate(consultationId, { videoCallActive: false });
      socket.to(consultationId).emit('video-call-ended', { senderType, senderId: socket.id });
    } catch (e) {
      console.error('end-video-call error', e);
    }
  });

  // End consultation
  socket.on('end-consultation', async (consultationId) => {
    try {
      const c = await Consultation.findById(consultationId);
      if (!c) return;
      c.status = 'completed';
      c.endedAt = new Date();
      await c.save();
      io.to(consultationId).emit('consultation-ended', { message: 'Consultation has ended. Thank you!' });
      console.log(`Consultation ${consultationId} ended`);
    } catch (e) {
      console.error('end-consultation error', e);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      console.log('User disconnected:', socket.id);
      const p = await Patient.findOne({ socketId: socket.id });
      if (p) {
        p.isWaiting = false;
        p.socketId = null;
        p.lastActive = new Date();
        await p.save();
        io.to('doctors').emit('patient-disconnected', p._id.toString());
      }
      const d = await Doctor.findOne({ socketId: socket.id });
      if (d) {
        d.isOnline = false;
        d.socketId = null;
        d.lastActive = new Date();
        await d.save();
      }
      // Note: We could also end any active consultations where either party disconnected.
    } catch (e) {
      console.error('disconnect error', e);
    }
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
