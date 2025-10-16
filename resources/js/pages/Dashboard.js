import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosLib from "axios";
import '../../sass/Dashboard.scss';

const Dashboard = () => {
  const [tab, setTab] = useState('Programs');
  
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NEW: Load activities from localStorage on component mount
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_activities');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading activities from localStorage:', error);
      return [];
    }
  });

  // NEW: Save activities to localStorage whenever activities change
  useEffect(() => {
    try {
      localStorage.setItem('dashboard_activities', JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activities to localStorage:', error);
    }
  }, [activities]);

  // Robust array normalizer for various API shapes
  const toArray = (res, key) => {
    const d = res?.data ?? res;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (key && Array.isArray(d?.[key])) return d[key];
    const firstArray = Object.values(d || {}).find(Array.isArray);
    return Array.isArray(firstArray) ? firstArray : [];
  };

  useEffect(() => {
    let alive = true;
    const axios = window.axios || axiosLib;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const [dRes, sRes, fRes, cRes] = await Promise.all([
          axios.get('/api/departments'),
          axios.get('/api/students'),
          axios.get('/api/faculty'),
          axios.get('/api/courses'),
        ]);
        if (!alive) return;
        setDepartments(toArray(dRes, 'departments'));
        setStudents(toArray(sRes, 'students'));
        setFaculty(toArray(fRes, 'faculty'));
        setCourses(toArray(cRes, 'courses'));
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e.message || 'Failed to load dashboard data');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // Helpers
  const norm = (v) => (v ?? '').toString().trim().toLowerCase();

  // Totals
  const totals = useMemo(() => {
    const activeCourses = courses.filter(c => norm(c.status) === 'active').length;
    return {
      totalStudents: students.length,
      totalFaculty: faculty.length,
      activeCourses,
      programs: departments.length
    };
  }, [students, faculty, courses, departments]);

  // Faculty per department stats (counts + average) - Fixed calculation
  const facultyPerDept = useMemo(() => {
    // Don't calculate if data isn't loaded yet
    if (loading || faculty.length === 0 || departments.length === 0) {
      return { counts: [], avg: 0, total: 0 };
    }

    const counts = departments.map(d => {
      const key = norm(d.name);
      // Count faculty in this department (checking both department and dean_department fields)
      const count = faculty.filter(f => 
        (f.department && norm(f.department) === key) || 
        (f.dean_department && norm(f.dean_department) === key)
      ).length;
      return { name: d.name, count };
    });
    
    // Calculate total and average, handling empty arrays
    const total = faculty.length;
    const nonEmptyDepts = counts.filter(d => d.count > 0).length || 1; // Avoid division by zero
    const avg = Math.round(total / nonEmptyDepts);
    
    return { counts, avg, total };
  }, [departments, faculty, loading]);

  // Program overview with percent bars - removed faculty references
  const programOverview = useMemo(() => {
    const rows = departments.map((d, i) => {
      const key = norm(d.name);
      const studentsCount = students.filter(s =>
        norm(s.department) === key || norm(s.program) === key
      ).length;
      // Removed faculty count calculation
      const coursesCount = courses.filter(c =>
        norm(c.program) === key || norm(c.department) === key
      ).length;
      return {
        id: d.id ?? d._id ?? d.name,
        name: d.name,
        students: studentsCount,
        courses: coursesCount,
        status: d.status || 'Active'
      };
    });
    const maxStudents = rows.reduce((m, r) => Math.max(m, r.students), 0);
    const colors = ['#4f46e5', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6'];
    return rows.map((r, i) => ({
      ...r,
      percent: maxStudents ? Math.round((r.students / maxStudents) * 100) : 0,
      color: colors[i % colors.length]
    }));
  }, [departments, students, courses]); // Removed faculty dependency

  // NEW: average students per department - improved calculation
  const studentsPerDept = useMemo(() => {
    // Don't calculate if data isn't loaded yet
    if (loading || students.length === 0 || departments.length === 0) {
      return { counts: [], avg: 0, total: 0 };
    }

    const counts = departments.map(d => {
      const key = norm(d.name);
      const count = students.filter(s =>
        norm(s.department) === key || norm(s.program) === key
      ).length;
      return { name: d.name, count };
    });
    
    // Calculate total and average, only counting departments that have students
    const total = students.length;
    const nonEmptyDepts = counts.filter(d => d.count > 0).length || 1; // Avoid division by zero
    const avg = Math.round(total / nonEmptyDepts);
    
    return { counts, avg, total };
  }, [departments, students, loading]);

  // NEW: Faculty distribution per department (percent of total faculty + bar width vs max)
  const facultyDistribution = useMemo(() => {
    const rows = departments.map(d => {
      const key = norm(d.name);
      const count = faculty.filter(f =>
        norm(f.department) === key || norm(f.dean_department) === key
      ).length;
      return { id: d.id ?? d._id ?? d.name, name: d.name, count };
    });

    const total = faculty.length || 1;
    const gradients = [
      'linear-gradient(90deg,#6d28d9,#4f46e5)',
      'linear-gradient(90deg,#1d4ed8,#0ea5e9)',
      'linear-gradient(90deg,#f59e0b,#ef4444)',
      'linear-gradient(90deg,#14b8a6,#22c55e)',
      'linear-gradient(90deg,#8b5cf6,#06b6d4)',
      'linear-gradient(90deg,#22c55e,#4f46e5)',
    ];

    return rows
      .map((r, i) => {
        const percent = Math.round((r.count / total) * 100);
        return {
          ...r,
          percent,
          // width now matches percent of total faculty
          width: percent,
          color: gradients[i % gradients.length],
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [departments, faculty]);

  // Stats cards (must return an array, not an object)
  const stats = useMemo(() => ([
    { label: 'Total Students', value: Number(totals?.totalStudents || 0).toLocaleString() },
    { label: 'Total Faculty', value: Number(totals?.totalFaculty || 0).toLocaleString() },
    { label: 'Active Courses', value: Number(totals?.activeCourses || 0).toLocaleString() },
    { label: 'Programs', value: Number(totals?.programs || 0).toLocaleString() },
  ]), [totals]);

  // Extract unique academic years from student data with stats
  const academicYears = useMemo(() => {
    if (loading || !students.length) return [];
    
    // Get unique academic years
    const yearsMap = {};
    
    students.forEach(student => {
      const year = student.academic_year || 'Unknown';
      if (!yearsMap[year]) {
        yearsMap[year] = {
          year,
          status: 'Active', // Default status
          students: 0,
          courses: []
        };
      }
      yearsMap[year].students++;
      
      // Track unique courses for this academic year
      if (student.course_id && !yearsMap[year].courses.includes(student.course_id)) {
        yearsMap[year].courses.push(student.course_id);
      }
    });
    
    // Sort academic years in descending order (newest first)
    return Object.values(yearsMap)
      .sort((a, b) => {
        // Extract years for comparison (e.g., "2024-2025" -> ["2024", "2025"])
        const yearsA = a.year.match(/\d{4}/g) || [];
        const yearsB = b.year.match(/\d{4}/g) || [];
        
        // Compare by first year number in descending order
        if (yearsA.length && yearsB.length) {
          return parseInt(yearsB[0]) - parseInt(yearsA[0]);
        }
        return a.year.localeCompare(b.year);
      });
  }, [students, loading]);
  
  // Function to toggle academic year status
  const toggleYearStatus = (year) => {
    setAcademicYears(prev => 
      prev.map(y => 
        y.year === year ? { ...y, status: y.status === 'Active' ? 'Completed' : 'Active' } : y
      )
    );
  };

  // State to manage academic year status changes
  const [academicYearsState, setAcademicYears] = useState([]);
  
  // Initialize academicYearsState when academicYears changes
  useEffect(() => {
    if (academicYears.length && !academicYearsState.length) {
      setAcademicYears(academicYears);
    }
  }, [academicYears]);

  // NEW: Function to add an activity to the activities list
  const addActivity = useCallback((type, description, entity = null) => {
    console.log('Adding activity:', { type, description, entity }); // Debug log
    setActivities(prev => {
      const newActivity = {
        id: Date.now() + Math.random(), // More unique ID
        type,
        description,
        entity,
        timestamp: new Date()
      };
      const updated = [newActivity, ...prev.slice(0, 19)]; // Keep only the 20 most recent activities
      console.log('Updated activities:', updated); // Debug log
      return updated;
    });
  }, []);

  // IMPROVED: Set up global event listeners that persist across navigation
  useEffect(() => {
    console.log('🔧 Setting up GLOBAL activity listeners...'); // Debug log

    // Create a function that always uses the current state
    const createEventHandler = (type, getDescription) => (e) => {
      console.log(`✅ ${type} event received:`, e.detail);
      
      // Use a functional update to ensure we always get the latest state
      setActivities(currentActivities => {
        const newActivity = {
          id: Date.now() + Math.random(),
          type: type.split('_')[0], // 'student_added' -> 'student'
          description: getDescription(e.detail),
          entity: e.detail,
          timestamp: new Date()
        };
        
        // Also save to localStorage immediately
        try {
          localStorage.setItem('dashboard_activities', JSON.stringify([newActivity, ...currentActivities.slice(0, 19)]));
        } catch (error) {
          console.error('Error saving activities to localStorage:', error);
        }
        
        return [newActivity, ...currentActivities.slice(0, 19)]; // Add this line
      });
    };

    // Simple, direct event handlers
    const handleStudentAdded = createEventHandler('student_added', (student) => 
      `New student enrolled: ${student.first_name} ${student.last_name}`
    );

    const handleStudentUpdated = createEventHandler('student_updated', (student) => 
      `Student profile updated: ${student.first_name} ${student.last_name}`
    );

    const handleStudentDeleted = createEventHandler('student_deleted', (student) => 
      `Student removed: ${student.first_name || 'Unknown'} ${student.last_name || 'Student'}`
    );

    const handleFacultyAdded = createEventHandler('faculty_added', (faculty) => 
      `New faculty member added: ${faculty.first_name} ${faculty.last_name}`
    );

    const handleFacultyUpdated = createEventHandler('faculty_updated', (faculty) => 
      `Faculty profile updated: ${faculty.first_name} ${faculty.last_name}`
    );

    const handleFacultyDeleted = createEventHandler('faculty_deleted', (faculty) => 
      `Faculty member removed: ${faculty.first_name || 'Unknown'} ${faculty.last_name || 'Faculty'}`
    );

    const handleCourseAdded = createEventHandler('course_added', (course) => 
      `New course created: ${course?.name || course?.course_name || 'Unknown Course'}`
    );

    const handleCourseUpdated = createEventHandler('course_updated', (course) => 
      `Course updated: ${course?.name || course?.course_name || 'Unknown Course'}`
    );

    const handleCourseDeleted = createEventHandler('course_deleted', (course) => 
      `Course deleted: ${course?.name || course?.course_name || 'Unknown Course'}`
    );

    const handleDepartmentAdded = createEventHandler('department_added', (dept) => 
      `New program created: ${dept?.name || 'Unknown Program'}`
    );

    const handleDepartmentUpdated = createEventHandler('department_updated', (dept) => 
      `Program updated: ${dept?.name || 'Unknown Program'}`
    );

    const handleDepartmentDeleted = createEventHandler('department_deleted', (dept) => 
      `Program deleted: ${dept?.name || 'Unknown Program'}`
    );

    // Remove existing listeners if they exist
    if (window.dashboardEventHandlers) {
      console.log('Removing existing event listeners...');
      Object.entries(window.dashboardEventHandlers).forEach(([eventName, handler]) => {
        window.removeEventListener(eventName, handler);
      });
    }

    // Store handlers and add listeners
    window.dashboardEventHandlers = {
      studentAdded: handleStudentAdded,
      studentUpdated: handleStudentUpdated,
      studentDeleted: handleStudentDeleted,
      facultyAdded: handleFacultyAdded,
      facultyUpdated: handleFacultyUpdated,
      facultyDeleted: handleFacultyDeleted,
      courseAdded: handleCourseAdded,
      courseUpdated: handleCourseUpdated,
      courseDeleted: handleCourseDeleted,
      departmentAdded: handleDepartmentAdded,
      departmentUpdated: handleDepartmentUpdated,
      departmentDeleted: handleDepartmentDeleted,
    };

    // Add event listeners
    window.addEventListener('studentAdded', handleStudentAdded);
    window.addEventListener('studentUpdated', handleStudentUpdated);
    window.addEventListener('studentDeleted', handleStudentDeleted);
    window.addEventListener('facultyAdded', handleFacultyAdded);
    window.addEventListener('facultyUpdated', handleFacultyUpdated);
    window.addEventListener('facultyDeleted', handleFacultyDeleted);
    window.addEventListener('courseAdded', handleCourseAdded);
    window.addEventListener('courseUpdated', handleCourseUpdated);
    window.addEventListener('courseDeleted', handleCourseDeleted);
    window.addEventListener('departmentAdded', handleDepartmentAdded);
    window.addEventListener('departmentUpdated', handleDepartmentUpdated);
    window.addEventListener('departmentDeleted', handleDepartmentDeleted);

    console.log('🎯 Global event listeners added successfully!');
    console.log('Available handlers:', Object.keys(window.dashboardEventHandlers));

    // Add initial system activity only if this is the first time
    setActivities(currentActivities => {
      if (currentActivities.length === 0) {
        const systemActivity = {
          id: Date.now(),
          type: 'system',
          description: 'Dashboard initialized successfully',
          entity: null,
          timestamp: new Date()
        };
        return [systemActivity];
      }
      return currentActivities;
    });

    // Cleanup function - but keep listeners active globally
    return () => {
      console.log('Dashboard component unmounting, keeping global listeners active');
    };
  }, []); // Empty dependency array is crucial here

  // Helper function to format time differences
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date); // Ensure date is a Date object
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    if (diffDay < 30) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    
    const date1 = new Date(date);
    return date1.toLocaleDateString();
  };

  // Helper to get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'student': return '👨‍🎓';
      case 'faculty': return '👨‍🏫';
      case 'course': return '📚';
      case 'department': return '🏢';
      case 'system': return '⚙️';
      case 'event': return '📅';
      case 'test': return '🧪';
      default: return '🔔';
    }
  };

  // Helper to get color for activity type
  const getActivityColor = (type) => {
    switch (type) {
      case 'student': return '#10b981'; // green
      case 'faculty': return '#6366f1'; // indigo
      case 'course': return '#f59e0b'; // amber
      case 'department': return '#3b82f6'; // blue
      case 'system': return '#6b7280'; // gray
      case 'event': return '#8b5cf6'; // purple
      case 'test': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  // NEW: Function to clear activities (for testing)
  const clearActivities = () => {
    setActivities([]);
    localStorage.removeItem('dashboard_activities');
  };

  // NEW: Function to test activity system
  const testActivitySystem = () => {
    setActivities(prev => {
      const newActivity = {
        id: Date.now() + Math.random(),
        type: 'test',
        description: 'Manual test activity added - system is working!',
        entity: { test: true },
        timestamp: new Date()
      };
      return [newActivity, ...prev.slice(0, 19)];
    });
  };

  // NEW: Function to test student event
  const testStudentEvent = () => {
    console.log('🧪 Manually triggering studentAdded event...');
    
    const testStudent = {
      id: 999,
      first_name: 'Test',
      last_name: 'Student',
      email: 'test@student.com',
      department: 'Computer Studies'
    };
    
    window.dispatchEvent(new CustomEvent('studentAdded', {
      detail: testStudent,
      bubbles: true
    }));
    
    console.log('Test student event dispatched');
  };

  // Also, let's add a debug function to test real event dispatching from the console
  const testRealStudentEvent = () => {
    console.log('🧪 Testing real student event dispatch...');
    
    // Simulate exactly what the Students component should dispatch
    const realStudentData = {
      id: 123,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      academic_year: '2024-2025',
      department: 'Computer Studies',
      program: 'Information Technology'
    };
    
    console.log('Dispatching with data:', realStudentData);
    
    const event = new CustomEvent('studentAdded', {
      detail: realStudentData,
      bubbles: true
    });
    
    window.dispatchEvent(event);
    console.log('Real student event dispatched successfully');
  };

  return (
    <div className="dashboard-root">
      <div className="dashboard-banner">
        <div className="dashboard-banner-content">
          <div className="dashboard-banner-title">Welcome Back, Bronny</div>
          <div className="dashboard-banner-sub">Father Saturnino Urios University - Faculty and Student Profile Management System Dashboard</div>
          <div className="dashboard-banner-desc">Here's what's happening in your academic institution today.</div>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="dashboard-stats-row">
        {(Array.isArray(stats) ? stats : []).map((stat, i) => (
          <div className="dashboard-stat-card" key={i}>
            <div className="dashboard-stat-label">{stat.label}</div>
            <div className="dashboard-stat-value">{loading ? '...' : stat.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-info-row">
        <div className="dashboard-info-card dashboard-students">
          <div className="dashboard-info-label">Avg Students per Department</div>
          <div className="dashboard-info-main">
            {loading ? '...' : studentsPerDept.avg}
          </div>
          <div className="dashboard-info-sub">
            {loading ? 'Loading...' : 
             `${studentsPerDept.total} students across ${departments.length} programs`}
          </div>
        </div>

        <div className="dashboard-info-card dashboard-faculty">
          <div className="dashboard-info-label">Faculty per Department</div>
          <div className="dashboard-info-main dashboard-info-main-avg">
            {loading ? '...' : `Avg ${facultyPerDept.avg}`}
          </div>
          <div className="dashboard-info-sub">
            {loading ? 'Loading...' : 
             `${facultyPerDept.total} faculty across ${departments.length} programs`}
          </div>
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

      {/* TABS CONTENT */}
      {tab === 'Programs' && (
        <div className="dashboard-program-overview">
          <div className="prog-header">
            <div className="prog-title">Program Overview</div>
            <div className="prog-sub">Students and courses by academic program</div>
          </div>

          {(loading ? [] : programOverview).map((prog, i) => {
            const gradients = [
              'linear-gradient(90deg,#6d28d9,#4f46e5)',
              'linear-gradient(90deg,#1d4ed8,#0ea5e9)',
              'linear-gradient(90deg,#f59e0b,#ef4444)',
              'linear-gradient(90deg,#14b8a6,#22c55e)',
              'linear-gradient(90deg,#8b5cf6,#06b6d4)',
              'linear-gradient(90deg,#22c55e,#4f46e5)',
            ];
            const fill = gradients[i % gradients.length];
            return (
              <div className="prog-card" key={prog.id}>
                <div className="prog-card-head">
                  <div className="prog-name">{prog.name}</div>
                  <div className="prog-percent">{prog.percent}%</div>
                </div>
                <div className="prog-meta">
                  {prog.students} students · {prog.courses} courses
                </div>
                <div className="prog-track">
                  <div
                    className="prog-fill"
                    style={{ width: `${prog.percent}%`, background: fill }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Faculty Distribution' && (
        <div className="dashboard-program-overview">
          <div className="prog-header">
            <div className="prog-title">Faculty Distribution by Department</div>
            <div className="prog-sub">Number of faculty members in each academic program</div>
          </div>

          {(loading ? [] : facultyDistribution).map((row, i) => {
            const gradients = [
              'linear-gradient(90deg,#6d28d9,#4f46e5)',
              'linear-gradient(90deg,#1d4ed8,#0ea5e9)',
              'linear-gradient(90deg,#f59e0b,#ef4444)',
              'linear-gradient(90deg,#14b8a6,#22c55e)',
              'linear-gradient(90deg,#8b5cf6,#06b6d4)',
              'linear-gradient(90deg,#22c55e,#4f46e5)',
            ];
            const fill = gradients[i % gradients.length];

            return (
              <div className="prog-card" key={row.id || row.name || i}>
                <div className="prog-card-head">
                  <div className="prog-name">{row.name}</div>
                  <div className="prog-percent">{row.percent}%</div>
                </div>
                <div className="prog-meta">{row.count} faculty</div>
                <div className="prog-track">
                  <div
                    className="prog-fill"
                    style={{ width: `${row.width}%`, background: fill }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Academic Years' && (
        <div className="dashboard-program-overview">
          <div className="prog-header">
            <div className="prog-title">Academic Year Statistics</div>
            <div className="prog-sub">Student enrollment and course completion by academic year</div>
          </div>

          {loading ? (
            <div className="ay-loading">Loading academic years...</div>
          ) : academicYearsState.length === 0 ? (
            <div className="ay-empty">No academic years data available</div>
          ) : (
            academicYearsState.map(year => (
              <div className="prog-card" key={year.year}>
                <div className="prog-card-head">
                  <div className="prog-name">{year.year}</div>
                  <button 
                    className={`ay-status-badge ${year.status.toLowerCase()}`}
                    onClick={() => toggleYearStatus(year.year)}
                  >
                    {year.status === 'Active' ? (
                      <>
                        <span className="status-icon">●</span>
                        Active
                      </>
                    ) : (
                      <>
                        <span className="status-icon">✓</span>
                        Completed
                      </>
                    )}
                  </button>
                </div>
                <div className="prog-meta">
                  {year.students} students enrolled · {year.courses.length} courses offered
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'Recent Activities' && (
        <div className="dashboard-program-overview">
          <div className="prog-header">
            <div className="prog-title">Recent Activities</div>
            <div className="prog-sub">Latest updates from your institution</div>
          </div>
          
          {/* Empty content - all activities removed */}
          <div className="ra-content">
            <div style={{ 
              padding: '32px 16px', 
              textAlign: 'center', 
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: '8px',
              margin: '16px 0'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>No activities</div>
              <div style={{ fontSize: '0.9rem' }}>This section has been cleared</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;