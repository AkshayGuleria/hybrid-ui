import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo';
import './Layout.css';

function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/reports', label: 'Reports' },
    { path: '/settings', label: 'Settings' },
  ];

  const handleAnalyticsClick = () => {
    // Set authentication in localStorage before loading iframe
    localStorage.setItem('isAuthenticated', 'true');
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="logo-container">
          <Logo />
        </div>

        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={item.path === '/analytics' ? handleAnalyticsClick : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
