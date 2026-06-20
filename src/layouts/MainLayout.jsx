import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import authAPI from '../services/authAPI';

export default function MainLayout({ user, onLogout, alert, clearAlert }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await authAPI.logout();
      onLogout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isActive = (paths) => {
    return paths.some(path => location.pathname === path || location.pathname.startsWith(path)) ? 'active' : '';
  };

  const hideNavbar = !user || location.pathname === '/login';

  return (
    <div>
      {/* Top Navbar */}
      {!hideNavbar && (
        <nav className="navbar navbar-expand-lg navbar-dark no-print" style={{ backgroundColor: 'var(--sidebar-bg)', padding: '12px 20px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <div className="container-fluid">
            {/* Logo / Brand */}
            <Link className="navbar-brand fw-bold d-flex align-items-center me-4" to="/create-invoice">
              <i className="bi bi-receipt-cutoff me-2 fs-5 text-primary"></i>
              Fabric Billing
            </Link>

            {/* Hamburger Toggle Button */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#topNavbarContent"
              aria-controls="topNavbarContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            {/* Collapsible Navbar content */}
            <div className="collapse navbar-collapse" id="topNavbarContent">
              {/* Left Side Links */}
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item me-2">
                  <Link className={`nav-link px-3 py-2 rounded ${isActive(['/create-invoice'])}`} to="/create-invoice">
                    <i className="bi bi-plus-circle me-1"></i> Create Invoice
                  </Link>
                </li>
                <li className="nav-item me-2">
                  <Link className={`nav-link px-3 py-2 rounded ${isActive(['/invoice-history'])}`} to="/invoice-history">
                    <i className="bi bi-file-earmark-text me-1"></i> Invoice History
                  </Link>
                </li>
              </ul>

              {/* Right Side Info & Actions */}
              <div className="d-flex align-items-lg-center flex-column flex-lg-row mt-2 mt-lg-0 gap-2">
                <span className="navbar-text me-lg-3 mb-2 mb-lg-0 text-white-50">
                  Welcome, <strong className="text-white">{user.username}</strong>
                </span>
                <Link to="/settings" className={`btn btn-outline-light btn-sm d-flex align-items-center me-lg-2 ${isActive(['/settings'])}`} title="Company Settings">
                  <i className="bi bi-gear-fill me-1"></i> Settings
                </Link>
                <a href="#logout" onClick={handleLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center">
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Page Content Container */}
      <div id="content" style={{ padding: '30px', minHeight: 'calc(100vh - 65px)' }}>
        {/* Message Notification Alert Section */}
        {alert && (
          <div className="container-fluid p-0 no-print mb-4">
            <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
              {alert.message}
              <button type="button" className="btn-close" onClick={clearAlert} aria-label="Close"></button>
            </div>
          </div>
        )}

        {/* Main Content Render */}
        <Outlet />
      </div>
    </div>
  );
}
