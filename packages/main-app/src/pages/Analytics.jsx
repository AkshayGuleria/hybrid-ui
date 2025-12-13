import { useEffect } from 'react';
import './AnalyticsIframe.css';

function Analytics() {
  useEffect(() => {
    // Ensure auth state is set before iframe loads
    localStorage.setItem('isAuthenticated', 'true');
  }, []);

  return (
    <div className="analytics-iframe-container">
      <iframe
        src="http://localhost:5173"
        title="Analytics Dashboard"
        className="analytics-iframe"
      />
    </div>
  );
}

export default Analytics;
