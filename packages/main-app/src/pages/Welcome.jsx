import './Welcome.css';

function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to Hybrid UI</h1>
        <p className="welcome-subtitle">
          Your modern application platform for seamless experiences
        </p>

        <div className="welcome-cards">
          <div className="welcome-card">
            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <span>🚀</span>
            </div>
            <h3>Get Started</h3>
            <p>Begin your journey with our intuitive platform</p>
          </div>

          <div className="welcome-card">
            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <span>📊</span>
            </div>
            <h3>Analytics</h3>
            <p>Track and analyze your data in real-time</p>
          </div>

          <div className="welcome-card">
            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <span>⚙️</span>
            </div>
            <h3>Configure</h3>
            <p>Customize your experience to fit your needs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
