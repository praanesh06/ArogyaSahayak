import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage.jsx';
import PatientPortal from './components/PatientPortal.jsx';
import DoctorPortal from './components/DoctorPortal.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/patient" element={<PatientPortal />} />
          <Route path="/doctor" element={<DoctorPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
