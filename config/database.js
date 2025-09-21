const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patient-doctor-app';
  await mongoose.connect(uri, { dbName: 'patient-doctor-app' });
  console.log('MongoDB connected');
}

module.exports = connectDB;

