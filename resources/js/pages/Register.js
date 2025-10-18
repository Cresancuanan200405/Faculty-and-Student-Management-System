import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', position: 'System Administrator' });

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
  await axios.post('/api/register', form);
  alert("Registration successful! Please log in.");
  navigate("/login");
    } catch (err) {
      alert("Registration failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <h1 className="auth-title">WELCOME</h1>
        <h2 className="auth-university">Father Saturnino Urios University</h2>
        <div className="auth-system-title">Faculty and Student Management System</div>
        <p className="auth-desc">
          The Registration Page of the Father Saturnino Urios University Faculty and Student Management System allows new administrators to securely create an account for access to faculty and student records.
        </p>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h3 className="auth-login-title">USER REGISTER</h3>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <span className="auth-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M14 14s-1-1.5-6-1.5S2 14 2 14V13a6 6 0 1 1 12 0v1z"/></svg>
              </span>
              <input
                type="text"
                className="auth-input"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="auth-input-group">
              <span className="auth-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M14 14s-1-1.5-6-1.5S2 14 2 14V13a6 6 0 1 1 12 0v1z"/></svg>
              </span>
              <input
                type="text"
                className="auth-input"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="auth-input-group">
              <span className="auth-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M14 14s-1-1.5-6-1.5S2 14 2 14V13a6 6 0 1 1 12 0v1z"/></svg>
              </span>
              <input
                type="email"
                className="auth-input"
                name="email"
                placeholder="Email"
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
            <div className="auth-input-group">
              <span className="auth-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M3 3h10v10H3z"/></svg>
              </span>
              <select
                className="auth-input"
                name="position"
                value={form.position}
                onChange={handleChange}
                required
              >
                <option>System Administrator</option>
                <option>Student</option>
                <option>Faculty</option>
              </select>
            </div>
            <button type="submit" className="auth-login-btn">REGISTER</button>
          </form>
          <p className="auth-register-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
