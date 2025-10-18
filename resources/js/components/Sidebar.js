import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import ConfirmModal from "./ConfirmModal";
import notifications from "../utils/notifications";
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
  const [user, setUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await axios.get('/api/me');
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUser();
  }, []);
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    notifications.info('Logged out successfully', 3000);
    onLogout && onLogout();
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

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
            {user?.profile_image_url ? (
              <img 
                src={user.profile_image_url} 
                alt={user.name || "User"} 
                onError={(e) => {
                  e.target.src = "/avatar-bronny.png";
                }}
              />
            ) : (
              <img src="/avatar-bronny.png" alt={user?.name || "User"} />
            )}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || "Loading..."}</div>
            <div className="sidebar-user-role">{user?.position || "User"}</div>
          </div>
        </Link>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H5c-1.1 0-2 .9-2 2v6h2V5h14v14H5v-6H3v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
        </button>
        <ConfirmModal
          open={showLogoutConfirm}
          title="Log out?"
          message="You will be signed out of your session."
          cancelText="Cancel"
          confirmText="Log out"
          onCancel={cancelLogout}
          onConfirm={confirmLogout}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
