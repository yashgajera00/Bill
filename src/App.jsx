import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import authAPI from './services/authAPI';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Settings from './pages/Settings';
import InvoiceHistory from './pages/InvoiceHistory';
import CreateInvoice from './pages/CreateInvoice';

// Protected Route wrapper component
function ProtectedRoute({ user, loading }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Load active session status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authAPI.status();
        if (data.isAuthenticated) {
          setUser({ username: data.username });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const triggerAlert = (message, type = 'success') => {
    setAlert({ message, type });
    // Auto-dismiss alert after 5 seconds
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const clearAlert = () => {
    setAlert(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public login route */}
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to="/create-invoice" replace />
            ) : (
              <Login onLoginSuccess={(username) => setUser({ username })} triggerAlert={triggerAlert} />
            )
          } 
        />

        {/* Protected routes wrapped in main Layout */}
        <Route element={<ProtectedRoute user={user} loading={loading} />}>
          <Route element={<MainLayout user={user} onLogout={() => setUser(null)} alert={alert} clearAlert={clearAlert} />}>
            {/* Index redirection */}
            <Route path="/" element={<Navigate to="/create-invoice" replace />} />
            
            {/* Settings route */}
            <Route path="/settings" element={<Settings triggerAlert={triggerAlert} />} />
            
            {/* Invoice routes */}
            <Route path="/invoice-history" element={<InvoiceHistory triggerAlert={triggerAlert} />} />
            <Route path="/create-invoice" element={<CreateInvoice triggerAlert={triggerAlert} mode="Add" />} />
            <Route path="/invoices/edit/:id" element={<CreateInvoice triggerAlert={triggerAlert} mode="Edit" />} />
          </Route>
        </Route>

        {/* Catch-all redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
