import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authAPI from '../services/authAPI';

export default function Login({ onLoginSuccess, triggerAlert }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(username, password);
      if (data.success) {
        onLoginSuccess(username);
        triggerAlert('Logged in successfully.', 'success');
        navigate('/create-invoice');
      } else {
        setError(data.error || 'Invalid username or password.');
        triggerAlert(data.error || 'Invalid credentials.', 'danger');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.error || 'Authentication server unreachable.';
      setError(errMsg);
      triggerAlert(errMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <i className="bi bi-receipt-cutoff"></i> TEXTILE
        </div>
        <div className="login-subtitle">
          GST Billing Software - Surat Edition
        </div>
        
        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            <i className="bi bi-exclamation-octagon-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id_username" className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-person text-muted"></i></span>
              <input
                type="text"
                className="form-control bg-white"
                id="id_username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="id_password" className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-lock text-muted"></i></span>
              <input
                type="password"
                className="form-control bg-white"
                id="id_password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2.5 fs-6 shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing In...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i> Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
