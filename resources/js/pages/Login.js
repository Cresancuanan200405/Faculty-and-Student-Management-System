import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import notifications from '../utils/notifications';
import { saveCredential, getCredential, deleteCredential } from '../utils/credentialStore';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing token in both storages
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // When the email/username changes, attempt to auto-fill a saved password for that identifier
  useEffect(() => {
    let cancelled = false;
    const email = (form.email || '').trim();
    if (!email) return; // nothing to look up
    (async () => {
      try {
        const saved = await getCredential(email);
        if (!cancelled && saved) {
          setForm((prev) => ({ ...prev, password: saved }));
        }
      } catch (e) {
        // silent fail; auto-fill is best-effort
        console.debug('Auto-fill lookup skipped:', e?.message || e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post('/api/login', form);
      
      if (!data.token) {
        throw new Error('No token received from server');
      }

      // Store token based on "Remember Me" preference
      if (remember) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      const user = data.user;
      if (onLogin) onLogin(user);
      
      notifications.add('Logged in successfully', 3000);

      // Save or remove saved credential based on Remember Me
      try {
        const email = (form.email || '').trim();
        if (remember && email && form.password) {
          await saveCredential(email, form.password);
        } else if (email) {
          await deleteCredential(email);
        }
      } catch (e) {
        console.debug('Credential save/remove skipped:', e?.message || e);
      }

      // Navigate based on user status
      if (user?.position === 'System Administrator' && !user?.profile_completed) {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      notifications.add(message, 5000, 'error');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-left-logo" aria-label="FSUU Logo" />
        <div className="auth-left-content">
          <h1 className="auth-title">WELCOME</h1>
          <h2 className="auth-university">Father Saturnino Urios University</h2>
          <p className="auth-motto">Luceat Lux Vestra</p>
          <div className="auth-system-title">Faculty and Student Management System</div>
          <p className="auth-desc">
            A secure and centralized platform designed exclusively for administrators to manage faculty and student records efficiently. This system ensures authorized access while maintaining the highest standards of data protection and privacy for the FSUU community.
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h3 className="auth-login-title">Administrator Login</h3>
          <p className="auth-login-subtitle">Access the management system</p>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-input-group">
              <span className="auth-icon" aria-hidden="true">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  <path d="M14 14s-1-1.5-6-1.5S2 14 2 14V13a6 6 0 1 1 12 0v1z"/>
                </svg>
              </span>
              <input
                type="text"
                className="auth-input"
                name="email"
                placeholder="Email or Username"
                autoComplete="username"
                value={form.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                aria-label="Email or Username"
              />
            </div>
            <div className="auth-input-group">
              <span className="auth-icon" aria-hidden="true">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a4 4 0 0 0-4 4v2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2V5a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v2H6V5a2 2 0 0 1 2-2zm-4 6h8v5H4V9z"/>
                </svg>
              </span>
              <input
                type="password"
                className="auth-input"
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                aria-label="Password"
              />
            </div>
            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setRemember(checked);
                    if (!checked) {
                      try {
                        const email = (form.email || '').trim();
                        if (email) await deleteCredential(email);
                      } catch (err) {
                        console.debug('Credential removal skipped:', err?.message || err);
                      }
                    }
                  }}
                  disabled={isLoading}
                />
                Remember Me
              </label>
              <span className="auth-forgot">
                <Link to="/forgot-password">Forgot Password?</Link>
              </span>
            </div>
            <button 
              type="submit" 
              className="auth-login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>
          <p className="auth-register-link">
            Don't have an account? <Link to="/register">Register Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;