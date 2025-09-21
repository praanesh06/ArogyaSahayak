# Patient-Doctor Connection Server

A modern React-based application that enables real-time communication between patients and doctors using WebSocket technology.

## Features

- **Real-time Communication**: Instant messaging between patients and doctors
- **Patient Queue Management**: Doctors can see waiting patients and accept consultations
- **Session Management**: Secure connection handling with automatic cleanup
- **Modern React UI**: Responsive, component-based interface for both patients and doctors
- **Server Status Monitoring**: Real-time server statistics

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the React application:
```bash
npm run build
```

3. Configure MongoDB (create .env):
```
MONGODB_URI=mongodb://127.0.0.1:27017/patient-doctor-app
```

4. Start the server:
```bash
npm start
```

## Development

For development with hot reloading:

1. **Full development mode** (server + React dev server):
```bash
npm run dev:full
```

2. **Server only** with auto-restart:
```bash
npm run dev
```

3. **React client only** (for frontend development):
```bash
npm run dev:client
```

## Usage

1. **Start the server** by running `npm start`
2. **Open your browser** and go to `http://localhost:3000`
3. **Choose your role**:
   - Click "Patient Portal" to join as a patient
   - Click "Doctor Portal" to join as a doctor

### For Patients:
1. Fill in your name, age, and symptoms
2. Click "Join Waiting Room"
3. Wait for a doctor to accept your consultation
4. Chat with your doctor in real-time
5. End consultation when finished

### For Doctors:
1. Enter your name and specialization
2. Click "Go Online"
3. View waiting patients and their symptoms
4. Click "Accept Patient" to start a consultation
5. Chat with the patient and provide medical advice
6. End consultation when finished

## API Endpoints

- `GET /` - Main portal page
- `GET /patient` - Patient interface
- `GET /doctor` - Doctor interface
- `GET /status` - Server/DB status (JSON)

## WebSocket Events

### Patient Events:
- `patient-join` - Patient joins the waiting room
- `send-message` - Send message during consultation
- `end-consultation` - End the current consultation

### Doctor Events:
- `doctor-join` - Doctor goes online
- `accept-patient` - Accept a waiting patient
- `send-message` - Send message during consultation
- `end-consultation` - End the current consultation

### Server Events:
- `patient-confirmed` - Patient successfully joined
- `doctor-confirmed` - Doctor successfully joined
- `new-patient` - New patient in waiting room
- `waiting-patients` - List of waiting patients
- `consultation-started` - Consultation begins
- `new-message` - New message received
- `consultation-ended` - Consultation ends

## Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **Frontend**: React 18, React Router
- **Build Tools**: Vite (fast and modern)
- **Styling**: Modern CSS with gradients and animations

## Server Status

Visit `http://localhost:3000/status` to see:
- Number of connected patients
- Number of connected doctors
- Number of waiting patients
- Number of active consultations

## Development

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## License

MIT License
