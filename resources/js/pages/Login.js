import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import notifications from '../utils/notifications';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState({}); // { identifier(lowercased): password }

  useEffect(() => {
    // ensure axios carries token if present
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    // load saved accounts (for autofill when Remember is used)
    try {
      const raw = localStorage.getItem('saved_accounts');
      if (raw) setSavedAccounts(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      const identifier = String(value).trim().toLowerCase();
      const next = { ...form, email: value };
      // Autofill password if we have a saved one for this identifier
      if (savedAccounts && savedAccounts[identifier]) {
        next.password = savedAccounts[identifier];
      }
      setForm(next);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleRememberToggle = (e) => {
    const checked = e.target.checked;
    setRemember(checked);
    if (checked) {
      const identifier = String(form.email || '').trim().toLowerCase();
      const saved = savedAccounts && savedAccounts[identifier];
      if (saved) {
        setForm((f) => ({ ...f, password: saved }));
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/login', form);
      if (data.token) {
        if (remember) {
          localStorage.setItem('token', data.token);
        } else {
          sessionStorage.setItem('token', data.token);
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
      // persist saved credentials for autofill if Remember is checked
      if (remember) {
        try {
          const identifier = String(form.email || '').trim().toLowerCase();
          const nextSaved = { ...(savedAccounts || {}) };
          nextSaved[identifier] = form.password;
          localStorage.setItem('saved_accounts', JSON.stringify(nextSaved));
          setSavedAccounts(nextSaved);
        } catch (_) {}
      }
      const user = data.user;
      if (onLogin) onLogin(user);
      notifications.add('Logged in successfully', 3000);
      if (user?.position === 'System Administrator' && !user?.profile_completed) {
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-left-logo" aria-hidden="true" />
        <div className="auth-left-content">
          <h1 className="auth-title">WELCOME</h1>
          <h2 className="auth-university">Father Saturnino Urios University</h2>
          <div className="auth-system-title">Faculty and Student Management System</div>
          <p className="auth-desc">
            The Login Page of the Father Saturnino Urios University Faculty and Student Management System provides a secure entry point exclusively for administrators, ensuring authorized access and protection of faculty and student records.
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h3 className="auth-login-title">USER LOGIN</h3>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-input-group">
              <span className="auth-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M14 14s-1-1.5-6-1.5S2 14 2 14V13a6 6 0 1 1 12 0v1z"/></svg>
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
              />
            </div>
            <div className="auth-input-group">
              <span className="auth-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a4 4 0 0 0-4 4v2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2V5a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v2H6V5a2 2 0 0 1 2-2zm-4 6h8v5H4V9z"/></svg>
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
              />
            </div>
            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={handleRememberToggle}
                />
                Remember
              </label>
              <span className="auth-forgot"><Link to="#">Forgot Password?</Link></span>
            </div>
            <button type="submit" className="auth-login-btn">LOG IN</button>
          </form>
          <p className="auth-register-link">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
