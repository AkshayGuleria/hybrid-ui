import './Logo.css';

function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <div className="logo-circle circle-1"></div>
        <div className="logo-circle circle-2"></div>
        <div className="logo-circle circle-3"></div>
      </div>
      <div className="logo-text">
        <span className="brand-name">Hybrid</span>
        <span className="brand-suffix">UI</span>
      </div>
    </div>
  );
}

export default Logo;
