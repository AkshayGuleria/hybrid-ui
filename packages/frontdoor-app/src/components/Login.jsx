import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error: authError } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Simple client-side validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    // Call IAM service through AuthContext
    const result = await login(username, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome</h1>
        <p className="subtitle">Please login to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="login-hint">
            <p>Demo credentials:</p>
            <ul>
              <li>admin / admin123</li>
              <li>user / user123</li>
              <li>demo / demo123</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
