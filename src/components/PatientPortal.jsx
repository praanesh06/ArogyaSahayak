import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import VideoCall from './VideoCall.jsx';

const PatientPortal = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    symptoms: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
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

    socket.on('patient-confirmed', (data) => {
      setIsJoining(false);
      setStatus(data.message);
      setStatusType('waiting');
    });

    socket.on('consultation-started', (data) => {
      setIsConnected(true);
      setConsultation(data);
      setStatus(data.message);
      setStatusType('connected');
    });

    socket.on('new-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    socket.on('consultation-ended', (data) => {
      setIsConnected(false);
      setConsultation(null);
      setStatus(data.message);
      setStatusType('error');
      setMessages([]);
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    });

    socket.on('disconnect', () => {
      setStatus('Connection lost. Please refresh the page.');
      setStatusType('error');
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

  const joinAsPatient = () => {
    if (!formData.name || !formData.age || !formData.symptoms) {
      alert('Please fill in all fields');
      return;
    }

    const patientData = {
      name: formData.name,
      age: parseInt(formData.age),
      symptoms: formData.symptoms
    };

    socketRef.current.emit('patient-join', patientData);
    setIsJoining(true);
  };

  const sendMessage = () => {
    if (newMessage.trim() && consultation) {
      socketRef.current.emit('send-message', {
        consultationId: consultation.consultationId,
        message: newMessage,
        senderType: 'patient'
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
            {isConnected && (
              <div className="status-badge connected">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                In Consultation
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
          <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-gray-600">Connect with healthcare providers for consultation</p>
        </div>

        {status && (
          <div className={`mb-6 status-badge ${statusType === 'waiting' ? 'waiting' : statusType === 'connected' ? 'connected' : 'error'}`}>
            {status}
          </div>
        )}

        {!isConnected ? (
          <div className="card max-w-2xl mx-auto">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Join Consultation</h2>
              <p className="text-gray-600">Enter your details to join the waiting room</p>
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
                <label className="form-label" htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="symptoms">Symptoms/Concerns</label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Describe your symptoms or health concerns..."
                  rows={4}
                  className="form-control"
                  required
                />
              </div>

              <button 
                className="btn btn-primary btn-block"
                onClick={joinAsPatient}
                disabled={isJoining}
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </div>
                ) : (
                  'Join Waiting Room'
                )}
              </button>
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
                    userType="patient"
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
                    <h3 className="font-semibold text-lg mb-2">Doctor Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p><strong>Name:</strong> Dr. {consultation?.doctor.name}</p>
                      <p><strong>Specialization:</strong> {consultation?.doctor.specialization}</p>
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
                              {message.senderType === 'patient' ? 'You' : 'Doctor'} • {new Date(message.timestamp).toLocaleTimeString()}
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
      </main>
    </div>
  );
};

export default PatientPortal;