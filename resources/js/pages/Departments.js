import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../../sass/Departments.scss';

const initialForm = {
  name: '',
  description: '',
  budget: '',
  status: 'Active'
};

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [activeTab, setActiveTab] = useState('Program List');
  const [editingDepartment, setEditingDepartment] = useState(null);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterStatus !== 'All Status') params.status = filterStatus;
      
      const { data } = await axios.get('/api/departments', { params });
      setDepartments(data.departments || []);
      setFetchError('');
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setFetchError('Failed to load departments');
    } finally { 
      setLoading(false); 
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

  const loadCourses = async () => {
    try {
      const { data } = await axios.get('/api/courses');
      setCourses(data.data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => { 
    loadDepartments(); 
    loadStudents();
    loadFaculty();
    loadCourses();
  }, []);
  
  useEffect(() => { 
    const t = setTimeout(loadDepartments, 350); 
    return () => clearTimeout(t); 
  }, [search, filterStatus]);

  const onChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const editDepartment = (dept) => {
    setEditingDepartment(dept);
    setForm({
      name: dept.name || '',
      description: dept.description || '',
      budget: dept.budget || '',
      status: dept.status || 'Active'
    });
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setEditingDepartment(null);
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        budget: form.budget ? Number(form.budget) : null
      };

      let response;
      if (editingDepartment) {
        response = await axios.put(`/api/departments/${editingDepartment.id}`, payload);
      } else {
        response = await axios.post('/api/departments', payload);
      }

      if (response.data.success) {
        await loadDepartments(); // Reload the list
        
        const message = editingDepartment ? 
          `Department "${payload.name}" has been updated successfully!` :
          `Department "${payload.name}" has been created successfully!`;
          
        alert(message);
        resetModal();
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save department';
      alert(`Error: ${errorMessage}`);
    } finally { 
      setSaving(false); 
    }
  };

  const deleteDepartment = async id => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;
    try {
      const response = await axios.delete(`/api/departments/${id}`);
      if (response.data.success) {
        await loadDepartments(); // Reload the list
        alert('Department deleted successfully!');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete department';
      alert(`Error: ${errorMessage}`);
    }
  };

  // Calculate department statistics
  const enrichedDepartments = departments.map(dept => {
    const deptStudents = students.filter(s => s.department === dept.name || s.program === dept.name);
    const deptFaculty = faculty.filter(f => f.department === dept.name || f.program === dept.name);
    const deptCourses = courses.filter(c => c.program === dept.name);
    
    return {
      ...dept,
      student_count: deptStudents.length,
      faculty_count: deptFaculty.length,
      course_count: deptCourses.length
    };
  });

  // Statistics
  const totalPrograms = enrichedDepartments.length;
  const totalStudents = enrichedDepartments.reduce((sum, d) => sum + d.student_count, 0);
  const totalFaculty = enrichedDepartments.reduce((sum, d) => sum + d.faculty_count, 0);
  const totalBudget = enrichedDepartments.reduce((sum, d) => sum + (parseFloat(d.budget) || 0), 0);

  const filtered = useMemo(() => {
    return enrichedDepartments.filter(d => {
      const q = search.trim().toLowerCase();
      const matchesQ = !q || d.name.toLowerCase().includes(q);
      const matchesS = filterStatus === 'All Status' || d.status === filterStatus;
      
      return matchesQ && matchesS;
    });
  }, [enrichedDepartments, search, filterStatus]);

  const statCards = [
    {
      label: 'Total Programs',
      value: totalPrograms,
      subText: 'Active academic programs'
    },
    {
      label: 'Total Students',
      value: totalStudents,
      subText: 'Across all programs'
    },
    {
      label: 'Total Faculty',
      value: totalFaculty,
      subText: 'Teaching staff'
    },
    {
      label: 'Total Budget',
      value: `$${(totalBudget / 1000000).toFixed(1)}M`,
      subText: 'Annual allocation'
    }
  ];

  return (
    <div className="departments-root">
      {/* Banner section */}
      <div className="departments-banner">
        <div className="departments-banner-content">
          <div className="departments-banner-title">Program Management</div>
          <div className="departments-banner-sub">
            FSUU - Manage academic programs and departments
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="departments-stats-row">
        {statCards.map((stat, i) => (
          <div key={i} className="departments-stat-card">
            <div className="departments-stat-value">{stat.value}</div>
            <div className="departments-stat-label">{stat.label}</div>
            <div className="departments-stat-sub">{stat.subText}</div>
          </div>
        ))}
      </div>

      {/* Controls section */}
      <div className="departments-controls">
        <div className="departments-tabs">
          <button className={`departments-tab ${activeTab === 'Program List' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Program List')}>
            Program List
          </button>
          <button className={`departments-tab ${activeTab === 'Program Overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Program Overview')}>
            Program Overview
          </button>
        </div>
      </div>

      {/* Program List Tab */}
      {activeTab === 'Program List' && (
        <div className="departments-main-section">
          <div className="departments-section-header">
            <div>
              <h2 className="departments-section-title">Academic Programs</h2>
              <p className="departments-section-subtitle">Manage program information and faculty assignments</p>
            </div>
            <button
              className="add-department-btn"
              onClick={() => {
                setEditingDepartment(null);
                setForm(initialForm);
                setShowModal(true);
              }}
            >
              Add Program
            </button>
          </div>

          {/* Filters */}
          <div className="departments-ui-filters">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input 
                placeholder="Search Programs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option>All Programs</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          {/* Table */}
          <div className="departments-ui-table-wrap">
            {fetchError && <div className="departments-ui-error">{fetchError}</div>}
            <table className="departments-ui-table">
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Students</th>
                  <th>Faculty</th>
                  <th>Courses</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="loading-cell">Loading...</td></tr>
                ) : filtered.length ? (
                  filtered.map(dept => (
                    <tr key={dept.id}>
                      <td className="department-cell">
                        <div className="department-name">{dept.name}</div>
                      </td>
                      <td><span className="count-number">{dept.student_count}</span></td>
                      <td><span className="count-number">{dept.faculty_count}</span></td>
                      <td><span className="count-number">{dept.course_count}</span></td>
                      <td><span className="budget-amount">${((parseFloat(dept.budget) || 0) / 1000000).toFixed(1)}M</span></td>
                      <td>
                        <span className={`status-pill ${dept.status.toLowerCase()}`}>
                          {dept.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button 
                            className="icon-btn" 
                            title="Edit department"
                            onClick={() => editDepartment(dept)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="icon-btn danger"
                            onClick={() => deleteDepartment(dept.id)}
                            title="Delete department"
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
                  <tr><td colSpan="7" className="empty-row">No programs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Program Overview Tab */}
      {activeTab === 'Program Overview' && (
        <div className="departments-main-section">
          <div className="departments-section-header">
            <div>
              <h2 className="departments-section-title">Program Overview</h2>
              <p className="departments-section-subtitle">Academic programs with detailed information</p>
            </div>
          </div>
          
          <div className="department-cards-grid">
            {filtered.map((dept) => (
              <div key={dept.id} className="department-overview-card">
                <div className="department-card-header">
                  <div className="department-card-title-section">
                    <h3 className="department-card-title">{dept.name}</h3>
                    <div className="department-card-description">{dept.description}</div>
                  </div>
                  <span className={`department-status-badge ${dept.status.toLowerCase()}`}>
                    {dept.status}
                  </span>
                </div>

                <div className="department-stats-row">
                  <div className="department-stat">
                    <div className="department-stat-number students">{dept.student_count}</div>
                    <div className="department-stat-label">Students</div>
                  </div>
                  <div className="department-stat">
                    <div className="department-stat-number faculty">{dept.faculty_count}</div>
                    <div className="department-stat-label">Faculty</div>
                  </div>
                  <div className="department-stat">
                    <div className="department-stat-number courses">{dept.course_count}</div>
                    <div className="department-stat-label">Courses</div>
                  </div>
                </div>

                <div className="department-details-section">
                  <div className="department-detail-row">
                    <span className="department-detail-label">Budget:</span>
                    <span className="department-detail-value">${((parseFloat(dept.budget) || 0) / 1000000).toFixed(1)}M</span>
                  </div>
                </div>

                <div className="department-card-actions">
                  <button 
                    className="department-action-btn edit"
                    onClick={() => editDepartment(dept)}
                    title="Edit department"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button 
                    className="department-action-btn delete"
                    onClick={() => deleteDepartment(dept.id)}
                    title="Delete department"
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

      {/* Modal */}
      {showModal && (
        <div className="departments-ui-modal-bg" onClick={() => !saving && resetModal()}>
          <div className="departments-ui-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingDepartment ? 'Edit Program' : 'Add New Program'}</h3>
              <button className="close-btn" onClick={() => !saving && resetModal()}>×</button>
            </div>
            <form onSubmit={submit} className="modal-form-grid">
              <div className="form-group">
                <label>Program Name *</label>
                <input name="name" value={form.name} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>Budget</label>
                <input name="budget" type="number" min="0" value={form.budget} onChange={onChange} />
              </div>
              <div className="form-group full">
                <label>Description</label>
                <textarea name="description" rows="3" value={form.description} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select name="status" value={form.status} onChange={onChange}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div className="modal-actions full">
                <button type="button" className="btn secondary" disabled={saving}
                  onClick={() => !saving && resetModal()}>Cancel</button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? (editingDepartment ? 'Updating...' : 'Creating...') : (editingDepartment ? 'Update Program' : 'Add Program')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
