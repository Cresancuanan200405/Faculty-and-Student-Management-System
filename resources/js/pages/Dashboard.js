import React, { useState } from "react";
import '../../sass/Dashboard.scss';

const stats = [
  { label: 'Total Students', value: '2,847', change: '-15% from last semester', color: 'aqua', subColor: 'green' },
  { label: 'Total Faculty', value: '178', change: '+8% from last semester', color: 'lightblue', subColor: 'green' },
  { label: 'Active Courses', value: '294', change: '+12% from last semester', color: 'peachpuff', subColor: 'green' },
  { label: 'Programs', value: '9', change: '0% from last semester', color: 'whitesmoke', subColor: 'gray' },
];

const programOverview = [
  { name: 'Computer Studies Program (CSP)', students: 445, faculty: 24, courses: 42, percent: 88, color: '#6c2eb7' },
  { name: 'Nursing Program', students: 387, faculty: 28, courses: 35, percent: 92, color: '#1e4ed8' },
];

const Dashboard = () => {
  const [tab, setTab] = useState('Programs');
  return (
    <div className="dashboard-root">
      <div className="dashboard-banner">
        <div className="dashboard-banner-content">
          <div className="dashboard-banner-title">Welcome Back, Bronny</div>
          <div className="dashboard-banner-sub">Father Saturnino Urios University - Faculty and Student Profile Management System Dashboard</div>
          <div className="dashboard-banner-desc">Here's what's happening in your academic institution today.</div>
        </div>
      </div>
      <div className="dashboard-stats-row">
        {stats.map((stat, i) => (
          <div className="dashboard-stat-card" key={i}>
            <div className="dashboard-stat-label">{stat.label}</div>
            <div className="dashboard-stat-value">{stat.value}</div>
            <div className="dashboard-stat-change" style={{ color: stat.subColor }}>{stat.change}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-info-row">
        <div className="dashboard-info-card dashboard-semester">
          <div className="dashboard-info-label">Current Semester</div>
          <div className="dashboard-info-main">Fall <span>2025</span></div>
          <div className="dashboard-info-sub">Academic Year 2025-2026</div>
        </div>
        <div className="dashboard-info-card dashboard-faculty">
          <div className="dashboard-info-label">Faculty per Department</div>
          <div className="dashboard-info-main dashboard-info-main-avg">Avg 19</div>
          <div className="dashboard-info-sub">Faculty members per program</div>
        </div>
      </div>
      <div className="dashboard-tabs">
        {['Programs', 'Faculty Distribution', 'Academic Years', 'Recent Activities'].map(tabName => (
          <button
            key={tabName}
            className={tab === tabName ? 'dashboard-tab active' : 'dashboard-tab'}
            onClick={() => setTab(tabName)}
          >
            {tabName}
          </button>
        ))}
      </div>
      <div className="dashboard-program-overview">
        <div className="dashboard-program-title">Program Overview</div>
        <div className="dashboard-program-desc">Students, faculty, and courses by academic program</div>
        {programOverview.map((prog, i) => (
          <div className="dashboard-program-bar-card" key={i}>
            <div className="dashboard-program-bar-label">
              <b>{prog.name}</b>
              <span className="dashboard-program-bar-meta">{prog.students} students · {prog.faculty} faculty · {prog.courses} courses</span>
            </div>
            <div className="dashboard-program-bar-bg">
              <div className="dashboard-program-bar" style={{ width: prog.percent + '%', background: prog.color }}></div>
              <span className="dashboard-program-bar-percent">{prog.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
