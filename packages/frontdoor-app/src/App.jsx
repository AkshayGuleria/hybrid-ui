import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Analytics from './components/Analytics';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Check if we're being accessed from an iframe (for Analytics)
  const isInIframe = window.self !== window.top;

  // If authenticated and in iframe, show Analytics
  // If authenticated and not in iframe, user will be redirected to main-app
  // If not authenticated, show Login
  if (isAuthenticated && isInIframe) {
    return <Analytics />;
  }

  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
