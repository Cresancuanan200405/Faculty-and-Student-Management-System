import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/login', form);
      if (onLogin) onLogin();
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <h1 className="auth-title">WELCOME</h1>
        <h2 className="auth-university">Father Saturnino Urios University</h2>
        <div className="auth-system-title">Faculty and Student Management System</div>
        <p className="auth-desc">
          The Login Page of the Father Saturnino Urios University Faculty and Student Management System provides a secure entry point exclusively for administrators, ensuring authorized access and protection of faculty and student records.
        </p>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h3 className="auth-login-title">ADMIN LOGIN</h3>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-input-group">
              <span className="auth-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M14 14s-1-1.5-6-1.5S2 14 2 14V13a6 6 0 1 1 12 0v1z"/></svg>
              </span>
              <input
                type="email"
                className="auth-input"
                name="email"
                placeholder="Username"
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
                  onChange={e => setRemember(e.target.checked)}
                />
                <span className="auth-checkmark">✔</span> Remember
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
