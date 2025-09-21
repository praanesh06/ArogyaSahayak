import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import VideoCall from './VideoCall.jsx';

const DoctorPortal = () => {
  const [formData, setFormData] = useState({
    name: '',
    specialization: ''
  });
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState('');
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socketRef.current = io();
    
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('doctor-confirmed', (data) => {
      setIsJoining(false);
      setIsOnline(true);
      setStatus(data.message);
    });

    socket.on('waiting-patients', (patients) => {
      setWaitingPatients(patients);
    });

    socket.on('new-patient', (patient) => {
      socket.emit('get-waiting-patients');
    });

    socket.on('patient-accepted', (patientId) => {
      setWaitingPatients(prev => prev.filter(p => p.id !== patientId));
    });

    socket.on('consultation-started', (data) => {
      setConsultation(data);
      setStatus(data.message);
    });

    socket.on('new-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    socket.on('consultation-ended', (data) => {
      setConsultation(null);
      setStatus('Consultation ended. You are back online.');
      setMessages([]);
    });

    socket.on('patient-disconnected', (patientId) => {
      setWaitingPatients(prev => prev.filter(p => p.id !== patientId));
    });

    socket.on('disconnect', () => {
      setStatus('Connection lost. Please refresh the page.');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const joinAsDoctor = () => {
    if (!formData.name || !formData.specialization) {
      alert('Please fill in all fields');
      return;
    }

    const doctorData = {
      name: formData.name,
      specialization: formData.specialization
    };
    socketRef.current.emit('doctor-join', doctorData);
    setIsJoining(true);
  };

  const acceptPatient = (patientId) => {
    socketRef.current.emit('accept-patient', patientId);
  };

  const sendMessage = () => {
    if (newMessage.trim() && consultation) {
      socketRef.current.emit('send-message', {
        consultationId: consultation.consultationId,
        message: newMessage,
        senderType: 'doctor'
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const endConsultation = () => {
    if (consultation) {
      socketRef.current.emit('end-consultation', consultation.consultationId);
    }
  };

  const displayWaitingPatients = () => {
    if (waitingPatients.length === 0) {
      return (
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">No patients waiting at the moment</p>
        </div>
      );
    }

    return waitingPatients.map(patient => (
      <div key={patient.id} className="patient-card">
        <div className="patient-info">
          <div className="patient-details">
            <h4 className="patient-name">{patient.name}</h4>
            <div className="patient-meta">
              <span><strong>Age:</strong> {patient.age} years</span>
              <span><strong>Joined:</strong> {new Date(patient.joinedAt).toLocaleTimeString()}</span>
            </div>
            <div className="patient-symptoms">
              <strong>Symptoms:</strong> {patient.symptoms}
            </div>
          </div>
          <div className="patient-actions">
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => acceptPatient(patient.id)}
            >
              Accept Patient
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span>TeleMed Connect</span>
          </div>
          <div className="flex items-center gap-4">
            {isOnline && (
              <div className="status-badge online">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Online
              </div>
            )}
            <Link to="/" className="text-gray-600 hover:text-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
          <p className="text-gray-600">Manage patient consultations and provide medical care</p>
        </div>

        {status && (
          <div className={`mb-6 ${isOnline ? 'status-badge online' : 'status-badge error'}`}>
            {status}
          </div>
        )}

        {!isOnline ? (
          <div className="card max-w-2xl mx-auto">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Go Online</h2>
              <p className="text-gray-600">Enter your details to start accepting patients</p>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="specialization">Specialization</label>
                <select
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select your specialization</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button 
                className="btn btn-primary btn-block"
                onClick={joinAsDoctor}
                disabled={isJoining}
              >
                {isJoining ? 'Connecting...' : 'Go Online'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {!consultation ? (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">Waiting Patients</h2>
                  <p className="text-gray-600">Patients waiting for consultation</p>
                </div>
                <div className="card-body">
                  {displayWaitingPatients()}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-xl font-semibold">Video Consultation</h2>
                      <div className="status-badge connected">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Connected
                      </div>
                    </div>
                    <div className="card-body">
                      <VideoCall
                        consultationId={consultation.consultationId}
                        userType="doctor"
                        socket={socketRef.current}
                        onEndCall={() => {}}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="card">
                    <div className="card-header">
                      <h2 className="text-xl font-semibold">Consultation Details</h2>
                    </div>
                    <div className="card-body">
                      <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">Patient Information</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p><strong>Name:</strong> {consultation.patient.name}</p>
                          <p><strong>Age:</strong> {consultation.patient.age} years</p>
                          <p><strong>Symptoms:</strong> {consultation.patient.symptoms}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg mb-2">Chat</h3>
                        <div className="chat-container">
                          {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p>No messages yet</p>
                              </div>
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div key={message.id} className={`chat-message ${message.senderType}`}>
                                <div className="message-info">
                                  {message.senderType === 'doctor' ? 'You' : 'Patient'} • {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                                <div className={`message-bubble ${message.senderType}`}>
                                  {message.text}
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>
                      
                      <div className="chat-input">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="form-control"
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                    <div className="card-footer">
                      <button 
                        className="btn btn-danger btn-block"
                        onClick={endConsultation}
                      >
                        End Consultation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DoctorPortal;