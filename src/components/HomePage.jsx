import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
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
          <nav>
            <Link to="/status" className="text-gray-600 hover:text-primary-600 font-medium">
              System Status
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Professional Telemedicine Platform</h1>
          <p className="hero-description">
            Connect with healthcare providers through secure, real-time video consultations from anywhere.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/patient" className="btn btn-primary btn-lg">
              Patient Portal
            </Link>
            <Link to="/doctor" className="btn btn-outline btn-lg">
              Doctor Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <div className="portal-cards">
        <Link to="/patient" className="portal-card">
          <div className="portal-card-header">
            <div className="portal-icon patient">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="portal-title">Patient Portal</h3>
              <p className="text-gray-600">Connect with healthcare providers</p>
            </div>
          </div>
          <div className="portal-card-body">
            <p className="portal-description">
              Schedule consultations, join video calls, and communicate with your healthcare team securely.
            </p>
          </div>
          <div className="portal-footer">
            <span>Start Consultation</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link to="/doctor" className="portal-card">
          <div className="portal-card-header">
            <div className="portal-icon doctor">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="portal-title">Doctor Portal</h3>
              <p className="text-gray-600">Manage patient consultations</p>
            </div>
          </div>
          <div className="portal-card-body">
            <p className="portal-description">
              Access patient queue, conduct video consultations, and provide remote healthcare services.
            </p>
          </div>
          <div className="portal-footer">
            <span>Access Portal</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Features Section */}
      <section className="features">
        <div className="features-content">
          <h2 className="features-title">Platform Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon video">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="feature-title">HD Video Calls</h3>
              <p className="feature-description">Crystal clear video consultations with professional quality</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon security">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="feature-title">Secure & Private</h3>
              <p className="feature-description">End-to-end encryption for patient data protection</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon chat">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="feature-title">Real-time Chat</h3>
              <p className="feature-description">Instant messaging during consultations</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon queue">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="feature-title">Queue Management</h3>
              <p className="feature-description">Efficient patient queue and appointment system</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
          <p>© {new Date().getFullYear()} TeleMed Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;