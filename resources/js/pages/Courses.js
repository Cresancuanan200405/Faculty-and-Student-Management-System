
import React, { useState } from 'react';
import '../../sass/Courses.scss';

const stats = [
  { label: 'Total Courses', value: '24', change: '24 active courses', color: 'total-courses' },
  { label: 'Total Enrollment', value: '670', change: 'Students enrolled', color: 'total-enrollment' },
  { label: 'Average Enrollment', value: '28', change: 'Per course', color: 'avg-enrollment' },
  { label: 'Programs', value: '9', change: 'Academic programs', color: 'programs' },
];

const coursesData = [
  {
    id: 1,
    course: 'Fundamentals of Accounting',
    code: 'ACC 101',
    program: 'Accountancy',
    instructor: 'Dr. Carmen Rodriguez',
    credits: 3,
    enrollment: '32/35',
    semester: 'Fall 2024-2025',
    status: 'Active'
  },
  {
    id: 2,
    course: 'Accounting Information Systems',
    code: 'AIS 201',
    program: 'Accountancy',
    instructor: 'Prof. Miguel Torres',
    credits: 3,
    enrollment: '32/35',
    semester: 'Fall 2024-2025',
    status: 'Active'
  },
  {
    id: 3,
    course: 'Internal Auditing',
    code: 'IA 301',
    program: 'Accountancy',
    instructor: 'CPA Maria Santos',
    credits: 3,
    enrollment: '32/35',
    semester: 'Fall 2024-2025',
    status: 'Active'
  },
  {
    id: 4,
    course: 'Management Accounting',
    code: 'MA 102',
    program: 'Accountancy',
    instructor: 'Dr. Roberto Cruz',
    credits: 3,
    enrollment: '32/35',
    semester: 'Fall 2024-2025',
    status: 'Active'
  },
  {
    id: 5,
    course: 'Introduction to Computer Science',
    code: 'ACC 101',
    program: 'Computer Studies',
    instructor: 'Dr. Anna Reyes',
    credits: 3,
    enrollment: '32/35',
    semester: 'Fall 2024-2025',
    status: 'Active'
  },
  {
    id: 6,
    course: 'Database Management Systems',
    code: 'IT 201',
    program: 'Computer Studies',
    instructor: 'Prof. Luis Garcia',
    credits: 3,
    enrollment: '32/35',
    semester: 'Fall 2024-2025',
    status: 'Active'
  },
  {
    id: 7,
    course: 'Computer Animation Fundamentals',
    code: 'ANIM 101',
    program: 'Computer Studies',
    instructor: 'Prof. Elena Morales',
    credits: 3,
    enrollment: '32/35',
    semester: 'Fall 2024-2025',
    status: 'Active'
  }
];

const Courses = () => {
  const [activeTab, setActiveTab] = useState('Course List');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    program: '',
    instructor: '',
    credits: '',
    maxEnrollment: '',
    semester: '',
    status: 'Active'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Course added: ${formData.courseName}`);
    setFormData({
      courseName: '',
      courseCode: '',
      program: '',
      instructor: '',
      credits: '',
      maxEnrollment: '',
      semester: '',
      status: 'Active'
    });
    setShowModal(false);
  };

  const filteredCourses = coursesData.filter(course => {
    const matchesSearch = course.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = selectedProgram === 'All Programs' || course.program === selectedProgram;
    const matchesStatus = selectedStatus === 'All Status' || course.status === selectedStatus;
    
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const getProgramBadgeClass = (program) => {
    return program === 'Accountancy' ? 'accountancy' : 'computer-studies';
  };

  return (
    <div className="courses-root">
      {/* Banner */}
      <div className="courses-banner">
        <div className="courses-banner-content">
          <div className="courses-banner-title">Course Management</div>
          <div className="courses-banner-sub">Manage academic courses and curriculum</div>
        </div>
        <div className="courses-banner-icon">📚</div>
      </div>

      {/* Statistics Cards */}
      <div className="courses-stats-row">
        {stats.map((stat, i) => (
          <div className={`courses-stat-card ${stat.color}`} key={i}>
            <div className="courses-stat-label">{stat.label}</div>
            <div className="courses-stat-value">{stat.value}</div>
            <div className="courses-stat-change">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Main Section */}
      <div className="courses-main-section">
        <div className="courses-section-header">
          <div>
            <div className="courses-section-title">Academic Courses</div>
            <div className="courses-section-subtitle">Manage course information and enrollment</div>
          </div>
          <button className="courses-add-btn" onClick={() => setShowModal(true)}>
            <span>+</span>
            Add Course
          </button>
        </div>

        {/* Tabs */}
        <div className="courses-tabs">
          {['Course List', 'Course Overview'].map(tabName => (
            <button
              key={tabName}
              className={activeTab === tabName ? 'courses-tab active' : 'courses-tab'}
              onClick={() => setActiveTab(tabName)}
            >
              {tabName}
            </button>
          ))}
        </div>

        {/* Search and Filter Controls */}
        <div className="courses-controls">
          <div className="courses-search">
            <div className="courses-search-icon">🔍</div>
            <input
              type="text"
              className="courses-search-input"
              placeholder="Search Courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="courses-filter">
            <select
              className="courses-filter-select"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
            >
              <option value="All Programs">All Programs</option>
              <option value="Accountancy">Accountancy</option>
              <option value="Computer Studies">Computer Studies</option>
            </select>
          </div>
          <div className="courses-filter">
            <select
              className="courses-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Courses Table */}
        <table className="courses-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Program</th>
              <th>Instructor</th>
              <th>Credits</th>
              <th>Enrollment</th>
              <th>Semester</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course) => (
              <tr key={course.id}>
                <td>
                  <div>
                    <strong>{course.course}</strong>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{course.code}</div>
                  </div>
                </td>
                <td>
                  <span className={`courses-program-badge ${getProgramBadgeClass(course.program)}`}>
                    {course.program}
                  </span>
                </td>
                <td>{course.instructor}</td>
                <td>{course.credits}</td>
                <td>
                  <span className="courses-enrollment">{course.enrollment}</span>
                </td>
                <td>
                  <span className="courses-semester">{course.semester}</span>
                </td>
                <td>
                  <span className={`courses-status ${course.status.toLowerCase()}`}>
                    {course.status}
                  </span>
                </td>
                <td>
                  <div className="courses-actions">
                    <button className="courses-action-btn edit">✏️</button>
                    <button className="courses-action-btn delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Course Modal */}
      {showModal && (
        <div className="courses-modal">
          <div className="courses-modal-content">
            <div className="courses-modal-header">
              <h3 className="courses-modal-title">Add New Course</h3>
              <button className="courses-modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="courses-form-group">
                <label className="courses-form-label">Course Name</label>
                <input
                  type="text"
                  name="courseName"
                  className="courses-form-input"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="courses-form-group">
                <label className="courses-form-label">Course Code</label>
                <input
                  type="text"
                  name="courseCode"
                  className="courses-form-input"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="courses-form-group">
                <label className="courses-form-label">Program</label>
                <select
                  name="program"
                  className="courses-form-select"
                  value={formData.program}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Program</option>
                  <option value="Accountancy">Accountancy</option>
                  <option value="Computer Studies">Computer Studies</option>
                </select>
              </div>
              <div className="courses-form-group">
                <label className="courses-form-label">Instructor</label>
                <input
                  type="text"
                  name="instructor"
                  className="courses-form-input"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="courses-form-group">
                <label className="courses-form-label">Credits</label>
                <input
                  type="number"
                  name="credits"
                  className="courses-form-input"
                  value={formData.credits}
                  onChange={handleInputChange}
                  min="1"
                  max="6"
                  required
                />
              </div>
              <div className="courses-form-group">
                <label className="courses-form-label">Max Enrollment</label>
                <input
                  type="number"
                  name="maxEnrollment"
                  className="courses-form-input"
                  value={formData.maxEnrollment}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="courses-form-group">
                <label className="courses-form-label">Semester</label>
                <select
                  name="semester"
                  className="courses-form-select"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Semester</option>
                  <option value="Fall 2024-2025">Fall 2024-2025</option>
                  <option value="Spring 2024-2025">Spring 2024-2025</option>
                  <option value="Summer 2024-2025">Summer 2024-2025</option>
                </select>
              </div>
              <div className="courses-form-buttons">
                <button type="button" className="courses-form-btn secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="courses-form-btn primary">
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
