import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../../sass/Courses.scss';

// Modified initialForm without academic_year
const initialForm = {
  name: '',
  description: '',
  credits: '',
  program: '',
  instructor: '',
  status: 'Active',
  max_students: ''
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Courses');
  const [activeTab, setActiveTab] = useState('Course List');
  const [editingCourse, setEditingCourse] = useState(null);

  // Load all data
  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterStatus !== 'All Courses') params.status = filterStatus;
      
      const { data } = await axios.get('/api/courses', { params });
      setCourses(data.courses || []);
      setFetchError('');
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setFetchError('Failed to load courses');
    } finally { 
      setLoading(false); 
    }
  };

  const loadDepartments = async () => {
    try {
      const { data } = await axios.get('/api/departments');
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const { data } = await axios.get('/api/students');
      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const loadFaculty = async () => {
    try {
      const { data } = await axios.get('/api/faculty');
      setFaculty(data.faculty || []);
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    }
  };

  useEffect(() => { 
    loadCourses(); 
    loadDepartments();
    loadStudents();
    loadFaculty();
  }, []);
  
  useEffect(() => { 
    const t = setTimeout(loadCourses, 350); 
    return () => clearTimeout(t); 
  }, [search, filterStatus]);

  // Get available programs from departments
  const availablePrograms = useMemo(() => {
    const programs = new Set();
    
    departments.forEach(dept => {
      if (dept.name) {
        programs.add(dept.name);
      }
    });

    return Array.from(programs).sort();
  }, [departments]);

  // Get available academic years from students
  const availableAcademicYears = useMemo(() => {
    const years = new Set();
    
    students.forEach(student => {
      if (student.academic_year) {
        let rawYear = student.academic_year.replace(/^SY\s*/, "");
        if (/^\d{4}-\d{4}$/.test(rawYear)) {
          years.add(`SY ${rawYear}`);
        } else if (/^\d{4}$/.test(rawYear)) {
          const start = Number(rawYear);
          years.add(`SY ${start}-${start + 1}`);
        }
      }
    });

    const customYears = localStorage.getItem("customYears");
    if (customYears) {
      try {
        const parsedCustomYears = JSON.parse(customYears);
        parsedCustomYears.forEach(year => {
          years.add(year);
        });
      } catch (err) {
        console.error('Failed to parse custom years from localStorage');
      }
    }

    const defaultYearFolders = [
      "SY 2020-2021",
      "SY 2021-2022", 
      "SY 2022-2023",
      "SY 2023-2024",
      "SY 2024-2025",
    ];
    
    defaultYearFolders.forEach(year => {
      years.add(year);
    });

    return Array.from(years).sort();
  }, [students]);

  // Get available faculty members in academic/teaching positions
  const availableFaculty = useMemo(() => {
    const academicPositions = [
      'Professor',
      'Associate Professor', 
      'Assistant Professor',
      'Instructors',
      'Supervising Instructors',
      'Teachers',
      'Chairperson',
      'Program Chair'
    ];

    return faculty.filter(member => {
      const isAcademicDept = member.department === 'Academic / Teaching Positions';
      const isAcademicPosition = academicPositions.includes(member.program);
      const isActive = member.status === 'Active';
      
      return (isAcademicDept || isAcademicPosition) && isActive;
    }).map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      position: member.program || member.department,
      email: member.email
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [faculty]);

  const onChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const editCourse = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name || '',
      description: course.description || '',
      credits: course.credits || '',
      program: course.program || '',
      instructor: course.instructor || '',
      status: course.status || 'Active',
      max_students: course.max_students || ''
    });
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setEditingCourse(null);
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        credits: form.credits ? Number(form.credits) : null,
        max_students: form.max_students ? Number(form.max_students) : null,
        department: form.program // added so the course belongs to a department
      };

      let response;
      if (editingCourse) {
        response = await axios.put(`/api/courses/${editingCourse.id}`, payload);
      } else {
        response = await axios.post('/api/courses', payload);
      }

      if (response.data.success) {
        await loadCourses();
        window.dispatchEvent(new Event('courseAdded'));
        
        const message = editingCourse ? 
          `Course "${payload.name}" has been updated successfully!` :
          `Course "${payload.name}" has been created successfully!`;
          
        alert(message);
        resetModal();
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save course';
      alert(`Error: ${errorMessage}`);
    } finally { 
      setSaving(false); 
    }
  };

  const deleteCourse = async id => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      const response = await axios.delete(`/api/courses/${id}`);
      if (response.data.success) {
        await loadCourses();
        alert('Course deleted successfully!');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete course';
      alert(`Error: ${errorMessage}`);
    }
  };

  // Statistics
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'Active').length;
  const totalInstructors = new Set(courses.filter(c => c.instructor).map(c => c.instructor)).size;
  const totalPrograms = new Set(courses.filter(c => c.program).map(c => c.program)).size;

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const q = search.trim().toLowerCase();
      const matchesQ = !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.program && c.program.toLowerCase().includes(q)) ||
        (c.instructor && c.instructor.toLowerCase().includes(q));
      
      const matchesS = filterStatus === 'All Courses' || c.status === filterStatus;
      
      return matchesQ && matchesS;
    });
  }, [courses, search, filterStatus]);

  const statCards = [
    {
      label: 'Total Courses',
      value: totalCourses,
      subText: 'All courses in system'
    },
    {
      label: 'Active Courses',
      value: activeCourses,
      subText: 'Currently offered'
    },
    {
      label: 'Instructors',
      value: totalInstructors,
      subText: 'Teaching faculty'
    },
    {
      label: 'Programs',
      value: totalPrograms,
      subText: 'Academic programs'
    }
  ];

  return (
    <div className="courses-root">
      {/* Banner section */}
      <div className="courses-banner">
        <div className="courses-banner-content">
          <div className="courses-banner-title">Course Management</div>
          <div className="courses-banner-sub">
            FSUU - Manage academic courses and curriculum
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="courses-stats-row">
        {statCards.map((stat, i) => (
          <div key={i} className="courses-stat-card">
            <div className="courses-stat-value">{stat.value}</div>
            <div className="courses-stat-label">{stat.label}</div>
            <div className="courses-stat-sub">{stat.subText}</div>
          </div>
        ))}
      </div>

      {/* Controls section */}
      <div className="courses-controls">
        <div className="courses-tabs">
          <button className={`courses-tab ${activeTab === 'Course List' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Course List')}>
            Course List
          </button>
          <button className={`courses-tab ${activeTab === 'Course Overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Course Overview')}>
            Course Overview
          </button>
        </div>
      </div>

      {/* Course List Tab */}
      {activeTab === 'Course List' && (
        <div className="courses-main-section">
          <div className="courses-section-header">
            <div>
              <h2 className="courses-section-title">Academic Courses</h2>
              <p className="courses-section-subtitle">Manage course information and instructor assignments</p>
            </div>
            <button
              className="add-course-btn"
              onClick={() => {
                setEditingCourse(null);
                setForm(initialForm);
                setShowModal(true);
              }}
            >
              Add Course
            </button>
          </div>

          {/* Filters */}
          <div className="courses-ui-filters">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input 
                placeholder="Search Courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All Courses">All Courses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          <div className="courses-ui-table-wrap">
            {fetchError && <div className="courses-ui-error">{fetchError}</div>}
            <table className="courses-ui-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Program</th>
                  <th>Instructor</th>
                  <th>Credits</th>
                  {/* Removed academic_year header */}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-cell">Loading...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map(course => (
                    <tr key={course.id}>
                      <td className="course-cell">
                        <div className="course-name">{course.name}</div>
                      </td>
                      <td>{course.program}</td>
                      <td>
                        <div className="instructor-info">
                          <div className="instructor-name">{course.instructor || 'Not Assigned'}</div>
                          
                        </div>
                      </td>
                      <td>
                        <span className="credits-number">{course.credits}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${course.status.toLowerCase()}`}>
                          {course.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button 
                            className="icon-btn" 
                            title="Edit course"
                            onClick={() => editCourse(course)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="icon-btn danger"
                            onClick={() => deleteCourse(course.id)}
                            title="Delete course"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-row">No courses found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Overview Tab */}
      {activeTab === 'Course Overview' && (
        <div className="courses-main-section">
          <div className="courses-section-header">
            <div>
              <h2 className="courses-section-title">Course Overview</h2>
              <p className="courses-section-subtitle">Academic courses with detailed information</p>
            </div>
          </div>
          
          <div className="course-cards-grid">
            {filtered.map((course) => (
              <div key={course.id} className="course-overview-card">
                <div className="course-card-header">
                  <div className="course-card-title-section">
                    <h3 className="course-card-title">{course.name}</h3>
                    <div className="course-card-description">{course.description}</div>
                  </div>
                  <span className={`course-status-badge ${course.status.toLowerCase()}`}>
                    {course.status}
                  </span>
                </div>

                <div className="course-details-section">
                  <div className="course-detail-row">
                    <span className="course-detail-label">Program:</span>
                    <span className="course-detail-value">{course.program}</span>
                  </div>
                  <div className="course-detail-row">
                    <span className="course-detail-label">Instructor:</span>
                    <span className="course-detail-value">{course.instructor || 'Not Assigned'}</span>
                  </div>
                  <div className="course-detail-row">
                    <span className="course-detail-label">Credits:</span>
                    <span className="course-detail-value">{course.credits}</span>
                  </div>
                  {/* Removed Academic Year row */}
                  {course.max_students && (
                    <div className="course-detail-row">
                      <span className="course-detail-label">Max Students:</span>
                      <span className="course-detail-value">{course.max_students}</span>
                    </div>
                  )}
                </div>

                <div className="course-card-actions">
                  <button 
                    className="course-action-btn edit"
                    onClick={() => editCourse(course)}
                    title="Edit course"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button 
                    className="course-action-btn delete"
                    onClick={() => deleteCourse(course.id)}
                    title="Delete course"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal - Removed semester field */}
      {showModal && (
        <div className="courses-ui-modal-bg" onClick={() => !saving && resetModal()}>
          <div className="courses-ui-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button className="close-btn" onClick={() => !saving && resetModal()}>×</button>
            </div>
            <form onSubmit={submit} className="modal-form-grid">
              <div className="form-group">
                <label>Course Name *</label>
                <input name="name" value={form.name} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>Program *</label>
                <select name="program" value={form.program} onChange={onChange} required>
                  <option value="">Select Program</option>
                  {availablePrograms.map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Instructor</label>
                <select name="instructor" value={form.instructor} onChange={onChange}>
                  <option value="">Select Instructor</option>
                  {availableFaculty.map(instructor => (
                    <option key={instructor.id} value={instructor.name}>
                      {instructor.name} ({instructor.position})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Credits *</label>
                <input name="credits" type="number" min="1" max="10" value={form.credits} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>Max Students</label>
                <input name="max_students" type="number" min="1" value={form.max_students} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select name="status" value={form.status} onChange={onChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group full">
                <label>Description</label>
                <textarea name="description" rows="3" value={form.description} onChange={onChange} />
              </div>

              <div className="modal-actions full">
                <button type="button" className="btn secondary" disabled={saving}
                  onClick={() => !saving && resetModal()}>Cancel</button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? (editingCourse ? 'Updating...' : 'Creating...') : (editingCourse ? 'Update Course' : 'Add Course')}
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
