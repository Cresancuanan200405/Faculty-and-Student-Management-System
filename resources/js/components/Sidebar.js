import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../sass/Sidebar.scss";

const menu = [
  { label: 'Dashboard', to: '/dashboard', icon: (
    <img src="/images/Dashboard_Manager.png" width="22" height="22" alt="Dashboard icon" />
  ) },
  { label: 'Students', to: '/students', icon: (
    <img src="/images/Student_Manager.png" width="22" height="22" alt="Students icon" />
  ) },
  { label: 'Faculty', to: '/faculty', icon: (
    <img src="/images/Faculty_Manager.png" width="22" height="22" alt="Faculty icon" />
  ) },
  { label: 'Courses', to: '/courses', icon: (
    <img src="/images/Course_Manager.png" width="22" height="22" alt="Courses icon" />
  ) },
  { label: 'Departments', to: '/departments', icon: (
    <img src="/images/Department_Manager.png" width="22" height="22" alt="Departments icon" />
  ) },
  { label: 'Reports', to: '/reports', icon: (
    <img src="/images/Report_Manager.png" width="22" height="22" alt="Reports icon" />
  ) },
  { label: 'Settings', to: '/settings', icon: (
    <img src="/images/Settings_Manager.png" width="22" height="22" alt="Settings icon" />
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

      {/* subtle divider to separate logo from navigation */}
      <div className="sidebar-divider" />

      <ul className="sidebar-menu">
        {menu.map(item => (
          <li key={item.label} className={location.pathname.startsWith(item.to) ? 'active' : ''}>
            <Link
              to={item.to}
              className="sidebar-link"
              aria-current={location.pathname.startsWith(item.to) ? 'page' : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-user-area">
        <Link to="/profile" className="sidebar-user-link" title="View profile">
          <div className="sidebar-user-avatar">
            <img src="/avatar-bronny.png" alt="Bronny James" />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Bronny James</div>
            <div className="sidebar-user-role">System Administrator</div>
          </div>
        </Link>
        <button className="sidebar-logout-btn" onClick={onLogout} title="Logout">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H5c-1.1 0-2 .9-2 2v6h2V5h14v14H5v-6H3v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
