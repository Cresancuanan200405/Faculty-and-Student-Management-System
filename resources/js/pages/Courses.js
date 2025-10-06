import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../../sass/Courses.scss';

const departmentOptions = [
  "Arts and Sciences","Accountancy","Business Administration","Criminal Justice Education",
  "Computer Studies","Engineering Technology","Law","Nursing","Teacher Education"
];

const yearOptions = ["2020-2021","2021-2022","2022-2023","2023-2024","2024-2025"];

// Academic teaching positions that can be instructors
const academicTeachingPositions = [
  "Professor",
  "Associate Professor", 
  "Assistant Professor",
  "Instructors",
  "Supervising Instructors",
  "Teachers",
  "Chairperson",
  "Program Chair"
];

// Define available courses for each department (matching your structure)
const departmentCourses = {
  "Arts and Sciences": [],
  "Accountancy": [
    "Accountancy",
    "Accounting Information System", 
    "Internal Auditing",
    "Management Accounting"
  ],
  "Business Administration": [
    "Business Administration Program",
    "Operation Management",
    "Financials Management",
    "Marketing Management", 
    "Human Resource Management"
  ],
  "Criminal Justice Education": [],
  "Computer Studies": [
    "Computer Science",
    "Information Technology",
    "Information Technology with Special Training in Computer Animation",
    "Diploma in Information Technology",
    "Library and Information Science",
    "Entertainment and Multimedia Computing"
  ],
  "Engineering Technology": [
    "Civil Engineering",
    "Industrial Engineering"
  ],
  "Law": [],
  "Nursing": [],
  "Teacher Education": [
    "Elementary Education",
    "Early Childhood Education", 
    "Physical Education",
    "Special Needs Education",
    "Secondary Education"
  ]
};

const initialForm = {
  name:'', description:'', program:'', instructor:'',
  credits:'', semester:'', academic_year: yearOptions[yearOptions.length-1],
  max_students:'', status:'Active'
};

const Courses = () => {
  const [courses,setCourses] = useState([]);
  const [students,setStudents] = useState([]);
  const [faculty,setFaculty] = useState([]);
  const [loading,setLoading] = useState(false);
  const [fetchError,setFetchError] = useState('');
  const [showModal,setShowModal] = useState(false);
  const [form,setForm] = useState(initialForm);
  const [saving,setSaving] = useState(false);
  const [search,setSearch] = useState('');
  const [filterProgram,setFilterProgram] = useState('All Programs');
  const [filterStatus,setFilterStatus] = useState('All Status');
  const [activeTab,setActiveTab] = useState('Course List');
  const [editingCourse, setEditingCourse] = useState(null);

  // Get student folder structure from localStorage (same as Students component)
  const [customYears, setCustomYears] = useState(() => {
    const saved = localStorage.getItem("customYears");
    return saved ? JSON.parse(saved) : [];
  });

  const yearFolders = [
    "SY 2020-2021",
    "SY 2021-2022", 
    "SY 2022-2023",
    "SY 2023-2024",
    "SY 2024-2025",
  ];

  const allYearFolders = [...yearFolders, ...customYears];

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterProgram !== 'All Programs') params.program = filterProgram;
      if (filterStatus !== 'All Status') params.status = filterStatus;
      const { data } = await axios.get('/api/courses',{ params });
      setCourses(data.data || []);
      setFetchError('');
    } catch {
      setFetchError('Failed to load courses');
    } finally { setLoading(false); }
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

  useEffect(()=>{ 
    loadCourses(); 
    loadStudents();
    loadFaculty();
  },[]);
  
  useEffect(()=>{ const t=setTimeout(loadCourses,350); return ()=>clearTimeout(t); },
    [search,filterProgram,filterStatus]);

  const onChange = e => {
    const {name,value} = e.target;
    setForm(f=>({...f,[name]:value}));
  };

  // Function to open edit modal
  const editCourse = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name || '',
      description: course.description || '',
      program: course.program || '',
      instructor: course.instructor || '',
      credits: course.credits || '',
      semester: course.semester || '',
      academic_year: course.academic_year || yearOptions[yearOptions.length-1],
      max_students: course.max_students || '',
      status: course.status || 'Active'
    });
    setShowModal(true);
  };

  // Function to get existing courses from student department structure
  const getExistingCoursesFromStudentStructure = () => {
    const existingCourses = [];
    
    // Get all student year folders and departments to derive courses
    const studentsByYearDept = {};
    
    students.forEach((stu) => {
      let yearFolder = "";
      
      // Always normalize to "SY xxxx-xxxx"
      let rawYear = (stu.academic_year || "").replace(/^SY\s*/, "");
      if (/^\d{4}-\d{4}$/.test(rawYear)) {
        yearFolder = `SY ${rawYear}`;
      } else if (/^\d{4}$/.test(rawYear)) {
        const start = Number(rawYear);
        yearFolder = `SY ${start}-${start + 1}`;
      }

      if (!allYearFolders.includes(yearFolder)) return;

      const groupKey = stu.program && stu.program !== "" ? stu.program : stu.department;

      if (!studentsByYearDept[yearFolder]) {
        studentsByYearDept[yearFolder] = {};
      }

      if (!studentsByYearDept[yearFolder][groupKey]) {
        studentsByYearDept[yearFolder][groupKey] = [];
      }

      studentsByYearDept[yearFolder][groupKey].push(stu);
    });

    // Create course entries for each existing department/program with students
    Object.entries(studentsByYearDept).forEach(([yearFolder, departments]) => {
      Object.entries(departments).forEach(([program, enrolledStudents]) => {
        // Find department for this program
        let department = program;
        
        // Check if this program belongs to a department with subfolders
        Object.entries(departmentCourses).forEach(([dept, programs]) => {
          if (programs.includes(program)) {
            department = dept;
          }
        });

        // If it's not in subfolders, it might be a direct department
        if (departmentOptions.includes(program)) {
          department = program;
        }

        const academicYear = yearFolder.replace(/^SY\s*/, "");
        
        existingCourses.push({
          id: `existing-${yearFolder}-${program}`,
          name: program,
          description: `${program} course for ${yearFolder}`,
          program: program,
          department: department,
          instructor: 'TBA', // To be assigned
          credits: null,
          semester: '',
          academic_year: academicYear,
          max_students: null,
          status: 'Active',
          is_existing: true,
          current_enrollment: enrolledStudents.length,
          created_from_students: true
        });
      });
    });

    return existingCourses;
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        credits: form.credits ? Number(form.credits) : null,
        max_students: form.max_students ? Number(form.max_students) : null
      };

      let response;
      let updatedCourse;

      if (editingCourse) {
        // Update existing course
        response = await axios.put(`/api/courses/${editingCourse.id}`, payload);
        updatedCourse = response.data.data;
        
        // Update the course in the list
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? updatedCourse : c));
        
        alert(`Course "${updatedCourse.name}" updated successfully!`);
      } else {
        // Create new course
        response = await axios.post('/api/courses', payload);
        updatedCourse = response.data.data;
        
        setCourses(prev => [updatedCourse, ...prev]);
        
        alert(`Course "${updatedCourse.name}" added successfully!`);
      }
      
      setShowModal(false);
      setForm(initialForm);
      setEditingCourse(null);
      
    } catch (err) {
      alert(err.response?.data?.message || (editingCourse ? 'Update failed' : 'Save failed'));
    } finally { setSaving(false); }
  };

  const deleteCourse = async id => {
    if (!confirm('Delete this course?')) return;
    try {
      await axios.delete(`/api/courses/${id}`);
      setCourses(courses.filter(c=>c.id!==id));
    } catch { alert('Delete failed'); }
  };

  // Function to get students enrolled in a course by matching department/program
  const getEnrolledStudents = (course) => {
    return students.filter(student => {
      // Match by department first
      if (student.department === course.program) return true;
      // Match by program if it exists
      if (student.program === course.program) return true;
      // Also check if student program matches the course name
      if (student.program === course.name) return true;
      return false;
    });
  };

  // Function to get available faculty instructors for the selected academic year
  const getAvailableFaculty = () => {
    if (!form.academic_year) return [];
    
    return faculty.filter(member => {
      // Check if faculty member is from the same academic year
      const memberYear = member.academic_year?.replace(/^SY\s*/, '');
      const selectedYear = form.academic_year;
      
      if (memberYear !== selectedYear) return false;
      
      // Check if faculty member is in academic teaching positions
      return academicTeachingPositions.includes(member.program) || 
             academicTeachingPositions.includes(member.department);
    });
  };

  // Function to organize courses by student department structure
  const getCoursesByStudentStructure = () => {
    const structure = {};
    const existingCourses = getExistingCoursesFromStudentStructure();
    
    existingCourses.forEach(course => {
      const yearKey = `SY ${course.academic_year}`;
      const deptKey = course.program;
      
      if (!structure[yearKey]) {
        structure[yearKey] = {};
      }
      
      if (!structure[yearKey][deptKey]) {
        structure[yearKey][deptKey] = [];
      }
      
      structure[yearKey][deptKey].push(course);
    });
    
    return structure;
  };

  // Generate comprehensive course list - existing courses from student structure + database courses + available options
  const generateComprehensiveCourseList = () => {
    const allCourses = [];
    
    // Add existing courses from student structure (these are active courses)
    const existingFromStudents = getExistingCoursesFromStudentStructure();
    allCourses.push(...existingFromStudents);
    
    // Add courses from database that are not already represented
    courses.forEach(course => {
      const isDuplicate = existingFromStudents.some(existing => 
        existing.name === course.name && 
        existing.program === course.program &&
        existing.academic_year === course.academic_year
      );
      
      if (!isDuplicate) {
        allCourses.push({
          ...course,
          is_existing: true,
          current_enrollment: getEnrolledStudents(course).length
        });
      }
    });
    
    // Add missing department courses as available options
    departmentOptions.forEach(department => {
      const availableCourses = departmentCourses[department] || [];
      
      availableCourses.forEach(courseName => {
        // Check if this course already exists
        const existingCourse = allCourses.find(course => 
          course.name === courseName && course.program === department
        );
        
        if (!existingCourse) {
          // Add as available course
          allCourses.push({
            id: `available-${department}-${courseName}`,
            name: courseName,
            program: department,
            instructor: '',
            credits: null,
            semester: '',
            academic_year: '',
            max_students: null,
            status: 'Available',
            is_existing: false,
            is_available: true,
            current_enrollment: 0
          });
        }
      });
    });
    
    return allCourses;
  };

  const comprehensiveCourseList = generateComprehensiveCourseList();
  const coursesByStudentStructure = getCoursesByStudentStructure();

  // Derived stats (count both existing from students and database)
  const existingCourses = comprehensiveCourseList.filter(c => c.is_existing || c.created_from_students);
  const totalCourses = existingCourses.length;
  const enrolledSum = existingCourses.reduce((s,c)=> s + (c.current_enrollment || 0), 0);
  const avgEnrollment = totalCourses ? Math.round(enrolledSum / totalCourses) : 0;
  const uniquePrograms = new Set(existingCourses.map(c=>c.program)).size;

  const filtered = useMemo(()=>{
    return comprehensiveCourseList.filter(c=>{
      const q = search.trim().toLowerCase();
      const matchesQ = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.program||'').toLowerCase().includes(q);
      const matchesP = filterProgram === 'All Programs' || c.program === filterProgram;
      
      let matchesS = false;
      if (filterStatus === 'All Status') {
        matchesS = true;
      } else if (filterStatus === 'Available') {
        matchesS = c.is_available;
      } else if (filterStatus === 'Active') {
        matchesS = (c.is_existing || c.created_from_students) && (c.status === 'Active' || c.created_from_students);
      } else {
        matchesS = c.status === filterStatus && (c.is_existing || c.created_from_students);
      }
      
      return matchesQ && matchesP && matchesS;
    });
  },[comprehensiveCourseList,search,filterProgram,filterStatus]);

  const statCards = [
    {
      label: 'Total Courses',
      value: totalCourses,
      subText: `${existingCourses.filter(c => c.status === 'Active' || c.created_from_students).length} active courses`
    },
    {
      label: 'Total Enrollment',
      value: enrolledSum,
      subText: 'Students enrolled',
      gradient: 'green'
    },
    {
      label: 'Average Enrollment',
      value: avgEnrollment,
      subText: 'Per course',
      gradient: 'peach'
    },
    {
      label: 'Programs',
      value: uniquePrograms,
      subText: 'Academic programs',
      gradient: 'cyan'
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

      {/* Course Overview Tab - Show courses organized by student department structure */}
      {activeTab === 'Course Overview' && (
        <div className="courses-main-section">
          <div className="courses-section-header">
            <div>
              <h2 className="courses-section-title">Course Folder Structure</h2>
              <p className="courses-section-subtitle">Courses organized within Student Department folders</p>
            </div>
          </div>
          
          <div className="course-folder-structure">
            {Object.keys(coursesByStudentStructure).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No courses found. Courses are automatically created based on student enrollments in departments/programs.
              </div>
            ) : (
              Object.entries(coursesByStudentStructure).map(([year, departments]) => (
                <div key={year} className="year-folder">
                  <div className="folder-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#6366f1">
                      <path d="M10 4H2v16h20V6H12l-2-2z" />
                    </svg>
                    <span className="folder-name">{year}</span>
                    <span className="folder-count">
                      {Object.keys(departments).length} department{Object.keys(departments).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="folder-content">
                    {Object.entries(departments).map(([dept, courseList]) => (
                      <div key={dept} className="department-folder">
                        <div className="folder-header sub">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#10b981">
                            <path d="M10 4H2v16h20V6H12l-2-2z" />
                          </svg>
                          <span className="folder-name">{dept}</span>
                          <span className="folder-count">
                            {courseList.length} course{courseList.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="folder-content">
                          {courseList.map((course) => (
                            <div key={course.id} className="course-folder">
                              <div className="course-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                  <polyline points="14,2 14,8 20,8"/>
                                </svg>
                                <div className="course-details">
                                  <div className="course-name">{course.name}</div>
                                  <div className="course-meta">
                                    {course.instructor && course.instructor !== 'TBA' && <span>Instructor: {course.instructor}</span>}
                                    {course.credits && <span>Credits: {course.credits}</span>}
                                    {course.semester && <span>Semester: {course.semester}</span>}
                                    <span>Students: {course.current_enrollment}/{course.max_students || 'N/A'}</span>
                                  </div>
                                </div>
                                <span className={`status-indicator ${course.status?.toLowerCase()}`}>
                                  {course.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Course List Tab */}
      {activeTab === 'Course List' && (
        <div className="courses-main-section">
          <div className="courses-section-header">
            <div>
              <h2 className="courses-section-title">Academic Courses</h2>
              <p className="courses-section-subtitle">Manage course information and enrollment</p>
            </div>
            <button
              className="add-course-btn"
              onClick={() => setShowModal(true)}
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
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
              <option>All Programs</option>
              {departmentOptions.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Available</option>
            </select>
          </div>

          {/* Table */}
          <div className="courses-ui-table-wrap">
            {fetchError && <div className="courses-ui-error">{fetchError}</div>}
            <table className="courses-ui-table">
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
                {loading ? (
                  <tr><td colSpan="8" className="loading-cell">Loading...</td></tr>
                ) : filtered.length ? (
                  filtered.map(course => (
                    <tr key={course.id} className={course.is_available ? 'available-course-row' : course.created_from_students ? 'active-from-students' : ''}>
                      <td className="course-cell">
                        <div className="course-name">{course.name}</div>
                        {course.is_available && (
                          <div className="course-available-note">
                            Available in {course.program} - Not yet created
                          </div>
                        )}
                        {course.created_from_students && (
                          <div className="course-active-note" style={{ color: '#059669', fontSize: '0.75rem' }}>
                            Active course (from student enrollments)
                          </div>
                        )}
                      </td>
                      <td><span className="program-badge">{course.program}</span></td>
                      <td>{course.instructor || (course.is_available ? 'Not assigned' : 'TBA')}</td>
                      <td>{course.credits || (course.is_available ? '-' : 'TBA')}</td>
                      <td>
                        <span className={course.current_enrollment === 0 ? 'enrollment-empty' : 'enrollment-filled'}>
                          {course.current_enrollment}/{course.max_students || (course.is_available ? '-' : 'TBA')}
                        </span>
                      </td>
                      <td>{course.semester} {course.academic_year}</td>
                      <td>
                        <span className={`status-pill ${course.is_available ? 'available' : course.status.toLowerCase()}`}>
                          {course.is_available ? 'Available' : course.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {course.is_available ? (
                            <button 
                              className="icon-btn create"
                              onClick={() => {
                                setForm({...initialForm, name: course.name, program: course.program});
                                setShowModal(true);
                              }}
                              title="Create this course"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                            </button>
                          ) : (
                            <>
                              <button className="icon-btn" title="Edit course">
                                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              {!course.created_from_students && (
                                <button 
                                  className="icon-btn danger"
                                  onClick={() => deleteCourse(course.id)}
                                  title="Delete course"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="empty-row">No courses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="courses-ui-modal-bg" onClick={()=>!saving && setShowModal(false)}>
          <div className="courses-ui-modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add New Course</h3>
              <button className="close-btn" onClick={()=>!saving && setShowModal(false)}>×</button>
            </div>
            <form onSubmit={submit} className="modal-form-grid">
              <div className="form-group full">
                <label>Course Name *</label>
                <input name="name" value={form.name} onChange={onChange} required />
              </div>
              <div className="form-group full">
                <label>Description</label>
                <textarea name="description" rows="3"
                  value={form.description} onChange={onChange}/>
              </div>
              <div className="form-group">
                <label>Program (Department) *</label>
                <select name="program" value={form.program} onChange={onChange} required>
                  <option value="">Select program</option>
                  {departmentOptions.map(d=> <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Academic Year *</label>
                <select name="academic_year" value={form.academic_year} onChange={onChange} required>
                  <option value="">Select academic year</option>
                  {yearOptions.map(y=> <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Instructor</label>
                <select 
                  name="instructor" 
                  value={form.instructor} 
                  onChange={onChange}
                  disabled={!form.academic_year}
                >
                  <option value="">Select instructor</option>
                  {getAvailableFaculty().map(member => (
                    <option key={member.id} value={`${member.first_name} ${member.last_name}`}>
                      {member.first_name} {member.last_name} - {member.program}
                    </option>
                  ))}
                  <option value="custom">Enter custom instructor name</option>
                </select>
                {form.instructor === 'custom' && (
                  <input 
                    type="text"
                    placeholder="Enter instructor name"
                    style={{ marginTop: '8px' }}
                    onChange={(e) => setForm(f => ({...f, instructor: e.target.value}))}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Credits</label>
                <input name="credits" type="number" min="0" max="30" value={form.credits} onChange={onChange}/>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select name="semester" value={form.semester} onChange={onChange}>
                  <option value="">Select semester</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
              </div>
              <div className="form-group">
                <label>Max Students</label>
                <input name="max_students" type="number" min="1" value={form.max_students} onChange={onChange}/>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select name="status" value={form.status} onChange={onChange}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              
              {/* Faculty availability info */}
              {form.academic_year && (
                <div className="form-group full">
                  <div className="faculty-info">
                    <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      Available Faculty: {getAvailableFaculty().length} academic teaching staff found for {form.academic_year}
                      {getAvailableFaculty().length === 0 && (
                        <span style={{ color: '#dc2626' }}> - No faculty members found for this academic year.</span>
                      )}
                    </small>
                  </div>
                </div>
              )}

              <div className="modal-actions full">
                <button type="button" className="btn secondary" disabled={saving}
                  onClick={()=>!saving && setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving? 'Saving...' : 'Add Course'}
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
