import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../sass/Sidebar.scss";

const menu = [
  { label: 'Dashboard', to: '/dashboard', icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/></svg>
  ) },
  { label: 'Students', to: '/students', icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.7 0 8 1.34 8 4v4H4v-4c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="currentColor"/></svg>
  ) },
  { label: 'Faculty', to: '/faculty', icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.7 0 8 1.34 8 4v4H4v-4c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="currentColor"/></svg>
  ) },
  { label: 'Courses', to: '/courses', icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" fill="currentColor"/></svg>
  ) },
  { label: 'Departments', to: '/departments', icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V7H7v2zm4 8h8v-2h-8v2zm0-4h8v-2h-8v2zm0-4h8V7h-8v2z" fill="currentColor"/></svg>
  ) },
  { label: 'Reports', to: '/reports', icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V7H7v2zm4 8h8v-2h-8v2zm0-4h8v-2h-8v2zm0-4h8V7h-8v2z" fill="currentColor"/></svg>
  ) },
  { label: 'Settings', to: '/settings', icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.007 7.007 0 0 0-1.63-.94l-.36-2.53A.488.488 0 0 0 14 2h-4a.488.488 0 0 0-.5.42l-.36 2.53c-.59.22-1.14.52-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22l-1.92 3.32a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.23.43.31.66.22l2.39-.96c.49.42 1.04.77 1.63.94l.36 2.53c.05.28.27.42.5.42h4c.23 0 .45-.14.5-.42l.36-2.53c.59-.22 1.14-.52 1.63-.94l2.39.96c.23.09.52.01.66-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" fill="currentColor"/></svg>
  ) },
];

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo-area">
        <div className="sidebar-logo-container">
          <img src="/images/urios_logo.jpg" alt="FSUU Logo" className="sidebar-logo-img" />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-title">FSUU</div>
          <div className="sidebar-logo-sub">Academic Management</div>
        </div>
      </div>
      <ul className="sidebar-menu">
        {menu.map(item => (
          <li key={item.label} className={location.pathname.startsWith(item.to) ? 'active' : ''}>
            <Link to={item.to} className="sidebar-link">
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-user-area">
        <div className="sidebar-user-avatar">
          <img src="/avatar-bronny.png" alt="Bronny James" />
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Bronny James</div>
          <div className="sidebar-user-role">System Administrator</div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout} title="Logout">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H5c-1.1 0-2 .9-2 2v6h2V5h14v14H5v-6H3v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
