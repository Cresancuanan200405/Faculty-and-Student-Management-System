import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosLib from "axios";
import '../../sass/Dashboard.scss';
import '../utils/activityBus'; // ensure bus is available for the whole app
// Charts
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

// --- Custom Chart.js Plugins for nicer visuals ---
// Value labels on top of bars
const barValueLabelsPlugin = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart, args, pluginOptions) {
    if (!pluginOptions?.show) return;
    const { ctx } = chart;
    ctx.save();
    const fontSize = pluginOptions.fontSize || 11;
    ctx.font = `${fontSize}px ${pluginOptions.fontFamily || 'Inter, system-ui, sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = pluginOptions.color || '#1f2937';
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets?.[0] || {};
    (meta?.data || []).forEach((bar, idx) => {
      const val = Array.isArray(dataset.data) ? dataset.data[idx] : undefined;
      if (val == null) return;
      const { x, y } = bar.tooltipPosition();
      ctx.fillText(val, x, y - 4);
    });
    ctx.restore();
  }
};

// Center text for doughnut chart
const doughnutCenterTextPlugin = {
  id: 'doughnutCenterText',
  afterDraw(chart, args, pluginOptions) {
    if (!pluginOptions) return;
    const { width, height, ctx } = chart;
    const txt = pluginOptions.text;
    const sub = pluginOptions.subText;
    if (!txt && !sub) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = width / 2;
    const cy = height / 2;
    if (txt) {
      ctx.font = `${pluginOptions.fontSize || 22}px ${pluginOptions.fontFamily || 'Inter, system-ui, sans-serif'}`;
      ctx.fillStyle = pluginOptions.color || '#111827';
      ctx.fillText(txt, cx, cy - (sub ? 6 : 0));
    }
    if (sub) {
      ctx.font = `${(pluginOptions.subFontSize || 12)}px ${pluginOptions.fontFamily || 'Inter, system-ui, sans-serif'}`;
      ctx.fillStyle = pluginOptions.subColor || '#6b7280';
      ctx.fillText(sub, cx, cy + 12);
    }
    ctx.restore();
  }
};

// Soft drop shadow for datasets
const softShadowPlugin = {
  id: 'softShadow',
  beforeDatasetsDraw(chart, args, pluginOptions) {
    const { ctx } = chart;
    ctx.save();
    ctx.shadowColor = pluginOptions.color || 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = pluginOptions.blur || 16;
    ctx.shadowOffsetX = pluginOptions.offsetX || 0;
    ctx.shadowOffsetY = pluginOptions.offsetY || 6;
  },
  afterDatasetsDraw(chart) {
    chart.ctx.restore();
  }
};

ChartJS.register(barValueLabelsPlugin, doughnutCenterTextPlugin, softShadowPlugin);

const DASHBOARD_BANNER_IMG = "/images/Dashboard_Manager.png"; // from public/images

// Lightweight, self-contained calendar component for the dashboard bottom section
const CalendarWidget = ({ activities = [] }) => {
  const [viewDate, setViewDate] = useState(() => {
    // Normalize to first of month to simplify calculations
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const todayKey = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = t.getMonth() + 1;
    const d = t.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }, []);

  // Build a quick map of activity counts keyed by YYYY-MM-DD
  const activityMap = useMemo(() => {
    const map = new Map();
    activities.forEach(a => {
      const dt = new Date(a.timestamp);
      if (isNaN(dt)) return;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [activities]);

  const monthMeta = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    // First day of current view month
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay(); // 0=Sun..6=Sat
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Previous month trailing days count to fill grid start
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Build 42 cells (6 weeks) to keep height stable
    const cells = [];

    // Leading days from previous month
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dateObj = new Date(year, month - 1, day);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        key,
        label: day,
        inMonth: false,
        isToday: key === todayKey,
        activityCount: activityMap.get(key) || 0,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        key,
        label: d,
        inMonth: true,
        isToday: key === todayKey,
        activityCount: activityMap.get(key) || 0,
      });
    }

    // Trailing days from next month to reach 42 cells
    const trailing = 42 - cells.length;
    for (let d = 1; d <= trailing; d++) {
      const dateObj = new Date(year, month + 1, d);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        key,
        label: d,
        inMonth: false,
        isToday: key === todayKey,
        activityCount: activityMap.get(key) || 0,
      });
    }

    const monthLabel = first.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    return { cells, monthLabel };
  }, [viewDate, activityMap, todayKey]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goPrev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => {
    const t = new Date();
    setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
  };

  return (
    <div className="dashboard-calendar">
      <div className="cal-header">
        <div className="cal-title">{monthMeta.monthLabel}</div>
        <div className="cal-nav">
          <button className="cal-btn" onClick={goPrev} aria-label="Previous month">◀</button>
          <button className="cal-btn cal-today" onClick={goToday}>Today</button>
          <button className="cal-btn" onClick={goNext} aria-label="Next month">▶</button>
        </div>
      </div>

      <div className="cal-grid cal-weekdays">
        {weekDays.map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
      </div>
      <div className="cal-grid cal-days">
        {monthMeta.cells.map(cell => (
          <div
            key={cell.key}
            className={[
              'cal-day',
              cell.inMonth ? 'in-month' : 'other-month',
              cell.isToday ? 'today' : ''
            ].join(' ')}
            title={`${cell.key}${cell.activityCount ? ` · ${cell.activityCount} activities` : ''}`}
          >
            <div className="cal-day-label">{cell.label}</div>
            {cell.activityCount > 0 && (
              <div className="cal-activity-dots" aria-hidden>
                {Array.from({ length: Math.min(cell.activityCount, 3) }).map((_, i) => (
                  <span key={i} className="cal-activity-dot" />
                ))}
                {cell.activityCount > 3 && (
                  <span className="cal-activity-more">+{cell.activityCount - 3}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [tab, setTab] = useState('Programs');
  const [hoveredQA, setHoveredQA] = useState('');
  
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);

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

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          const axios = window.axios || axiosLib;
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

  // Helper function to get department color
  const getDepartmentColor = (departmentName) => {
    const name = norm(departmentName);
    const colorMap = {
      'arts and sciences': 'linear-gradient(90deg, #86efac, #4ade80)', // Light Green
      'accountancy': 'linear-gradient(90deg, #7dd3fc, #38bdf8)', // Light Blue
      'business administration': 'linear-gradient(90deg, #fef08a, #facc15)', // Light Yellow
      'criminal justice education': 'linear-gradient(90deg, #fca5a5, #ef4444)', // Red
      'computer studies': 'linear-gradient(90deg, #c4b5fd, #8b5cf6)', // Violet
      'engineering technology': 'linear-gradient(90deg, #fdba74, #f97316)', // Orange
      'law': 'linear-gradient(90deg, #d1d5db, #6b7280)', // Gray
      'nursing': 'linear-gradient(90deg, #93c5fd, #3b82f6)', // Blue
      'teacher education': 'linear-gradient(90deg, #bbf7d0, #22c55e)', // Green
      'tourism and hospitality management': 'linear-gradient(90deg, #3b82f6, #facc15)' // Blue to Yellow
    };
    return colorMap[name] || 'linear-gradient(90deg, #6b7280, #4b5563)'; // Default gray
  };

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
    return rows.map((r, i) => ({
      ...r,
      percent: maxStudents ? Math.round((r.students / maxStudents) * 100) : 0,
      color: getDepartmentColor(r.name)
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

    return rows
      .map((r, i) => {
        const percent = Math.round((r.count / total) * 100);
        return {
          ...r,
          percent,
          // width now matches percent of total faculty
          width: percent,
          color: getDepartmentColor(r.name),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [departments, faculty]);

  // ---------- Charts data ----------
  // Palette to match existing aesthetic
  const chartPalette = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#10b981','#f97316','#84cc16','#06b6d4','#a855f7','#14b8a6'];

  // Refs for export functionality
  const barRef = useRef(null);
  const doughnutRef = useRef(null);

  const exportChartAsPNG = useCallback((ref, filename) => {
    try {
      const chart = ref?.current;
      if (!chart) return alert('Chart not ready');
      const url = chart.toBase64Image('image/png', 1);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export chart');
    }
  }, []);

  // Toggle between stacked / normal bar display for added interactivity
  const [barMode, setBarMode] = useState('normal');
  const toggleBarMode = () => setBarMode(m => m === 'normal' ? 'stacked' : 'normal');

  // Skeleton state (briefly show skeleton if loading or data just empty)
  const showStudentSkeleton = loading && (studentsPerDept.counts || []).length === 0;
  const showFacultySkeleton = loading && (facultyDistribution || []).length === 0;

  const studentsPerDeptChart = useMemo(() => {
    const labels = (studentsPerDept.counts || []).map(i => i.name);
    const data = (studentsPerDept.counts || []).map(i => i.count);
    return {
      data: {
        labels,
        datasets: [{
          label: 'Students',
          data,
          backgroundColor: labels.map((_, idx) => chartPalette[idx % chartPalette.length]),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBackgroundColor: labels.map((_, idx) => chartPalette[(idx + 1) % chartPalette.length]),
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 42,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Students per Department', color: '#111827', font: { size: 15, weight: 'bold' } },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.9)',
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => `Students: ${ctx.parsed.y}`
            }
          },
          barValueLabels: { show: true, fontSize: 11, color: '#111827' },
          softShadow: { blur: 14, offsetY: 8, color: 'rgba(0,0,0,0.12)' }
        },
        scales: {
          x: {
            ticks: { color: '#6b7280', font: { size: 11 } },
            grid: { display: false },
            title: { display: false }
          },
          y: {
            ticks: { color: '#6b7280', precision: 0, font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
            border: { display: false }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    };
  }, [studentsPerDept, chartPalette, barMode]);

  const facultyDistributionChart = useMemo(() => {
    const top = (facultyDistribution || []).slice(0, 12); // cap slices for clarity
    const labels = top.map(i => i.name);
    const data = top.map(i => i.count);
    const totalFaculty = data.reduce((a,b) => a + b, 0);
    return {
      data: {
        labels,
        datasets: [{
          label: 'Faculty',
          data,
          backgroundColor: labels.map((_, idx) => chartPalette[idx % chartPalette.length]),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 10,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#374151', boxWidth: 14, padding: 16 } },
          title: { display: true, text: 'Faculty Distribution', color: '#111827', font: { size: 15, weight: 'bold' } },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.9)',
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed} faculty`
            }
          },
          doughnutCenterText: { text: totalFaculty, subText: 'Faculty', fontSize: 24, subFontSize: 12, color: '#111827', subColor: '#6b7280' },
          softShadow: { blur: 18, offsetY: 10, color: 'rgba(0,0,0,0.15)' }
        }
      }
    };
  }, [facultyDistribution, chartPalette]);

  // NEW: Derived quick insights for dashboard summary cards
  const dashboardInsights = useMemo(() => {
    try {
      const largestDept = (() => {
        const counts = studentsPerDept.counts || [];
        if (!counts.length) return null;
        return counts.reduce((max, cur) => cur.count > (max?.count || 0) ? cur : max, counts[0]);
      })();
      const smallestDept = (() => {
        const counts = (studentsPerDept.counts || []).filter(c => c.count > 0);
        if (!counts.length) return null;
        return counts.reduce((min, cur) => cur.count < (min?.count || Infinity) ? cur : min, counts[0]);
      })();
      const ratioSF = faculty.length ? (students.length / faculty.length) : 0;
      const latestActivity = activities[0] || null;
      // Archived years count from localStorage
      let archivedYearsCount = 0;
      try {
        const map = JSON.parse(localStorage.getItem('settings_academic_year_statuses') || '{}');
        archivedYearsCount = Object.values(map).filter(v => String(v).toLowerCase() === 'archived').length;
      } catch (_) {}
      return {
        largestDept,
        smallestDept,
        ratioSF: ratioSF ? ratioSF.toFixed(1) : '—',
        latestActivity,
        archivedYearsCount
      };
    } catch (err) {
      return { largestDept: null, smallestDept: null, ratioSF: '—', latestActivity: null, archivedYearsCount: 0 };
    }
  }, [studentsPerDept, students, faculty, activities]);

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
  
  // Dashboard reflects statuses from Settings; no toggling here.

  // State to manage academic year status changes
  const [academicYearsState, setAcademicYears] = useState([]);
  
  // Helper: consistent descending sort (e.g., 2024-2025 by first year)
  const sortAcademicYearsDesc = useCallback((arr) => {
    return [...(arr || [])].sort((a, b) => {
      const ya = (a?.year || '').match(/\d{4}/g) || [];
      const yb = (b?.year || '').match(/\d{4}/g) || [];
      if (ya.length && yb.length) return parseInt(yb[0]) - parseInt(ya[0]);
      return String(a?.year || '').localeCompare(String(b?.year || ''));
    });
  }, []);
  
  // Build union of years from Students-derived list and Settings statuses (localStorage)
  const rebuildAcademicYearsState = useCallback(() => {
    let savedStatuses = {};
    try {
      const saved = localStorage.getItem('settings_academic_year_statuses');
      savedStatuses = saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading academic year statuses from localStorage:', error);
    }

    // Start with years derived from students
    const byKey = new Map();
    (academicYears || []).forEach(y => {
      const merged = { ...y };
      if (savedStatuses[y.year]) merged.status = savedStatuses[y.year];
      byKey.set(y.year, merged);
    });

    // Add years that exist only in Settings (no students yet)
    Object.keys(savedStatuses || {}).forEach((key) => {
      if (!byKey.has(key)) {
        byKey.set(key, {
          year: key,
          status: savedStatuses[key],
          students: 0,
          courses: []
        });
      }
    });

    const union = Array.from(byKey.values());
    setAcademicYears(sortAcademicYearsDesc(union));
  }, [academicYears, sortAcademicYearsDesc]);
  
  // Initialize/refresh academicYearsState when academicYears list or statuses change
  useEffect(() => {
    rebuildAcademicYearsState();
  }, [rebuildAcademicYearsState]);

  // Listen for Settings updates to AY statuses and refresh mapping
  useEffect(() => {
    const onStatusUpdated = () => rebuildAcademicYearsState();
    const onYearAdded = () => rebuildAcademicYearsState();
    const onYearDeleted = () => rebuildAcademicYearsState();
    window.addEventListener('academicYearStatusUpdated', onStatusUpdated);
    window.addEventListener('academicYearAdded', onYearAdded);
    window.addEventListener('academicYearDeleted', onYearDeleted);
    return () => {
      window.removeEventListener('academicYearStatusUpdated', onStatusUpdated);
      window.removeEventListener('academicYearAdded', onYearAdded);
      window.removeEventListener('academicYearDeleted', onYearDeleted);
    };
  }, [rebuildAcademicYearsState]);

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
    // If ActivityBus is initialized, simply subscribe to its updates and skip registering listeners here
    if (window.__activityBusInitialized) {
      const onUpdated = (e) => {
        const list = e?.detail?.activities;
        if (Array.isArray(list)) {
          setActivities(list);
        } else {
          try {
            const saved = JSON.parse(localStorage.getItem('dashboard_activities')) || [];
            setActivities(saved);
          } catch {}
        }
      };
      window.addEventListener('dashboardActivitiesUpdated', onUpdated);

      // Seed from storage
      try {
        const saved = JSON.parse(localStorage.getItem('dashboard_activities')) || [];
        setActivities(saved.length ? saved : [{
          id: Date.now(),
          type: 'system',
          description: 'Dashboard initialized successfully',
          entity: null,
          timestamp: new Date()
        }]);
      } catch {}

      return () => window.removeEventListener('dashboardActivitiesUpdated', onUpdated);
    }

    // Fallback: original listener setup (runs only if bus didn't initialize)
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

    const handleStudentYearArchived = createEventHandler(
      'event_studentYearArchived',
      (p) => `Students SY archived: ${p?.label || 'Unknown'}`
    );
    const handleStudentYearRestored = createEventHandler(
      'event_studentYearRestored',
      (p) => `Students SY restored: ${p?.label || 'Unknown'}`
    );
    const handleFacultyYearArchived = createEventHandler(
      'event_facultyYearArchived',
      (p) => `Faculty SY archived: ${p?.label || 'Unknown'}`
    );
    const handleFacultyYearRestored = createEventHandler(
      'event_facultyYearRestored',
      (p) => `Faculty SY restored: ${p?.label || 'Unknown'}`
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
      studentYearArchived: handleStudentYearArchived,
      studentYearRestored: handleStudentYearRestored,
      facultyYearArchived: handleFacultyYearArchived,
      facultyYearRestored: handleFacultyYearRestored,
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
    window.addEventListener('studentYearArchived', handleStudentYearArchived);
    window.addEventListener('studentYearRestored', handleStudentYearRestored);
    window.addEventListener('facultyYearArchived', handleFacultyYearArchived);
    window.addEventListener('facultyYearRestored', handleFacultyYearRestored);

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

  // Admin quick actions helpers
  const go = (path) => { try { window.location.href = path; } catch (_) {} };
  const clearLocalCaches = () => {
    try {
      const keys = [
        'dashboard_activities',
        'settings_academic_year_statuses',
        'settings_academic_year_statuses_prev',
        'studentsCustomYears',
        'facultyCustomYears',
        'studentsArchivedYears',
        'facultyArchivedYears'
      ];
      keys.forEach(k => localStorage.removeItem(k));
      addActivity('system', 'Local caches cleared by admin');
      alert('Local caches cleared. Some views may refresh on next load.');
    } catch (e) {
      console.error('Failed clearing local caches', e);
    }
  };

  return (
    <div className="dashboard-root">
      <div className="dashboard-banner">
        <div className="dashboard-banner-content">
          {/* Icon + title/sub, styled like Students banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
              flex: 1
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: "#f59e0b",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px #0002",
                overflow: "hidden",
                flexShrink: 0
              }}
            >
              <img
                src={DASHBOARD_BANNER_IMG}
                alt="Dashboard Management"
                style={{ width: "70%", height: "70%", objectFit: "contain" }}
                onError={(e) => {
                  // Hide image container if not found
                  e.currentTarget.parentElement.style.display = "none";
                }}
              />
            </div>
            <div style={{ minWidth: 200 }}>
              <div className="dashboard-banner-title">
                Welcome Back, {user?.name || 'User'}
              </div>
              <div className="dashboard-banner-sub">
                Father Saturnino Urios University - Faculty and Student Profile Management System Dashboard
              </div>
            </div>
          </div>

          {/* Keep the existing descriptive bar below the header */}
          <div className="dashboard-banner-desc">
            Here's what's happening in your academic institution today.
          </div>
        </div>
      </div>
      
      {error && <div className="dashboard-error">{error}</div>}

      {/* NEW LAYOUT: Two-column responsive grid */}
      <div
        className="dashboard-main-grid"
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          width: '100%',
          marginTop: 20
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ flex: '1 1 620px', minWidth: 320 }}>
          {/* Stats row */}
          <div className="dashboard-stats-row" style={{ marginBottom: 20 }}>
            {(Array.isArray(stats) ? stats : []).map((stat, i) => (
              <div className="dashboard-stat-card" key={i}>
                <div className="dashboard-stat-label">{stat.label}</div>
                <div className="dashboard-stat-value">{loading ? '...' : stat.value}</div>
              </div>
            ))}
          </div>

          {/* Info cards (averages) */}
            <div className="dashboard-info-row" style={{ marginBottom: 20 }}>
              <div className="dashboard-info-card dashboard-students">
                <div className="dashboard-info-label">Avg Students / Dept</div>
                <div className="dashboard-info-main">{loading ? '...' : studentsPerDept.avg}</div>
                <div className="dashboard-info-sub">{loading ? 'Loading...' : `${studentsPerDept.total} students · ${departments.length} programs`}</div>
              </div>
              <div className="dashboard-info-card dashboard-faculty">
                <div className="dashboard-info-label">Faculty / Dept</div>
                <div className="dashboard-info-main dashboard-info-main-avg">{loading ? '...' : `Avg ${facultyPerDept.avg}`}</div>
                <div className="dashboard-info-sub">{loading ? 'Loading...' : `${facultyPerDept.total} faculty · ${departments.length} programs`}</div>
              </div>
            </div>

          {/* Tabs */}
          <div className="dashboard-tabs" style={{ marginBottom: 12 }}>
            {['Programs', 'Faculty Distribution', 'Academic Years', 'Recent Activities'].map(tabName => (
              <button
                key={tabName}
                className={tab === tabName ? 'dashboard-tab active' : 'dashboard-tab'}
                onClick={(e) => { e.preventDefault(); setTab(tabName); }}
              >
                {tabName}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="dashboard-tab-content" style={{ minHeight: 200 }}>
            {tab === 'Programs' && (
              <div className="dashboard-program-overview">
                <div className="prog-header">
                  <div className="prog-title">Program Overview</div>
                  <div className="prog-sub">Students and courses by academic program</div>
                </div>
                {(loading ? [] : programOverview).map(prog => (
                  <div className="prog-card" key={prog.id}>
                    <div className="prog-card-head">
                      <div className="prog-name">{prog.name}</div>
                      <div className="prog-percent">{prog.percent}%</div>
                    </div>
                    <div className="prog-meta">{prog.students} students · {prog.courses} courses</div>
                    <div className="prog-track"><div className="prog-fill" style={{ width: `${prog.percent}%`, background: prog.color }} /></div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'Faculty Distribution' && (
              <div className="dashboard-program-overview">
                <div className="prog-header">
                  <div className="prog-title">Faculty Distribution</div>
                  <div className="prog-sub">Faculty members per department</div>
                </div>
                {(loading ? [] : facultyDistribution).map(row => (
                  <div className="prog-card" key={row.id || row.name}>
                    <div className="prog-card-head">
                      <div className="prog-name">{row.name}</div>
                      <div className="prog-percent">{row.percent}%</div>
                    </div>
                    <div className="prog-meta">{row.count} faculty</div>
                    <div className="prog-track"><div className="prog-fill" style={{ width: `${row.width}%`, background: row.color }} /></div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'Academic Years' && (
              <div className="dashboard-program-overview">
                <div className="prog-header">
                  <div className="prog-title">Academic Year Statistics</div>
                  <div className="prog-sub">Enrollment & offerings per year</div>
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
                        <span className={`ay-status-badge ${String(year.status || '').toLowerCase()}`} title={`Status: ${year.status}`} style={{ cursor: 'default' }}>
                          {String(year.status).toLowerCase() === 'active' && (<><span className="status-icon">●</span>Active</>)}
                          {String(year.status).toLowerCase() === 'completed' && (<><span className="status-icon">✓</span>Completed</>)}
                          {String(year.status).toLowerCase() === 'inactive' && (<><span className="status-icon">–</span>Inactive</>)}
                          {String(year.status).toLowerCase() === 'archived' && (<><span className="status-icon">▣</span>Archived</>)}
                        </span>
                      </div>
                      <div className="prog-meta">{year.students} students · {year.courses.length} courses</div>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === 'Recent Activities' && (
              <div className="dashboard-program-overview">
                <div className="prog-header">
                  <div className="prog-title">Recent Activities</div>
                  <div className="prog-sub">Latest institutional updates</div>
                </div>
                <div className="ra-content">
                  {activities.length === 0 ? (
                    <div className="ra-empty">
                      <div className="ra-empty-icon">🔔</div>
                      <div className="ra-empty-title">No activities yet</div>
                      <div className="ra-empty-desc">Changes to students, faculty, courses, or departments will appear here</div>
                    </div>
                  ) : (
                    <>
                      <div className="ra-list">
                        {activities.map(activity => (
                          <div className="ra-item" key={activity.id}>
                            <div className="ra-icon" style={{ backgroundColor: getActivityColor(activity.type) }}>{getActivityIcon(activity.type)}</div>
                            <div className="ra-details">
                              <div className="ra-description">{activity.description}</div>
                              <div className="ra-time">{formatTimeAgo(activity.timestamp)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="ra-controls"><button className="ra-button" onClick={clearActivities}>Clear All Activities</button></div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: '1 1 380px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Calendar at the top */}
          <div className="dashboard-side-section" style={{ background: '#fff', borderRadius: 18, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
            <div className="prog-header" style={{ marginBottom: 12 }}>
              <div className="prog-title">Calendar</div>
              <div className="prog-sub">Activity days are marked</div>
            </div>
            <CalendarWidget activities={activities} />
          </div>
          {/* Charts below calendar */}
          <div className="dashboard-side-section" style={{ background: '#fff', borderRadius: 18, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
            <div className="prog-header" style={{ marginBottom: 12 }}>
              <div className="prog-title">Charts</div>
              <div className="prog-sub">Students & faculty overview</div>
            </div>
            <div className="dashboard-charts-grid" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="chart-card" style={{ minHeight: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{barMode === 'normal' ? 'Standard view' : 'Stacked (simulated)'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={toggleBarMode} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Toggle Mode</button>
                    <button onClick={() => exportChartAsPNG(barRef, 'students_per_department.png')} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Export PNG</button>
                  </div>
                </div>
                {showStudentSkeleton ? (
                  <div style={{ height: 240, display: 'grid', gridTemplateColumns: `repeat(${Math.max((studentsPerDept?.counts || []).length, 5)},1fr)`, alignItems: 'end', gap: 6 }}>
                    {Array.from({ length: Math.max((studentsPerDept?.counts || []).length, 5) }).map((_, i) => (
                      <div key={i} style={{ background: 'linear-gradient(180deg,#f1f5f9,#e2e8f0)', height: `${20 + (i % 5) * 10}px`, borderRadius: 6, opacity: .6, animation: 'pulse 1.2s ease-in-out infinite' }} />
                    ))}
                  </div>
                ) : ((studentsPerDept?.counts || []).length === 0 ? (
                  <div className="chart-empty">No student data</div>
                ) : (
                  <div className="chart-canvas" style={{ height: 240 }}>
                    <Bar ref={barRef} data={studentsPerDeptChart.data} options={studentsPerDeptChart.options} />
                  </div>
                ))}
              </div>
              <div className="chart-card" style={{ minHeight: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 6 }}>
                  <button onClick={() => exportChartAsPNG(doughnutRef, 'faculty_distribution.png')} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Export PNG</button>
                </div>
                {showFacultySkeleton ? (
                  <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                  </div>
                ) : ((facultyDistribution || []).length === 0 ? (
                  <div className="chart-empty">No faculty data</div>
                ) : (
                  <div className="chart-canvas" style={{ height: 240 }}>
                    <Doughnut ref={doughnutRef} data={facultyDistributionChart.data} options={facultyDistributionChart.options} />
                  </div>
                ))}
              </div>
            </div>
            {/* NEW Insights strip below charts */}
            <div className="dashboard-insights" style={{ marginTop: 20, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
              <div className="insight-card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.5px' }}>Largest Dept</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{dashboardInsights.largestDept ? dashboardInsights.largestDept.name : '—'}</div>
                <div style={{ fontSize: 12, color: '#0c4a6e' }}>{dashboardInsights.largestDept ? `${dashboardInsights.largestDept.count} students` : 'No data'}</div>
              </div>
              <div className="insight-card" style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '.5px' }}>Smallest Dept</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{dashboardInsights.smallestDept ? dashboardInsights.smallestDept.name : '—'}</div>
                <div style={{ fontSize: 12, color: '#713f12' }}>{dashboardInsights.smallestDept ? `${dashboardInsights.smallestDept.count} students` : 'No data'}</div>
              </div>
              <div className="insight-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '.5px' }}>Student:Faculty</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#065f46' }}>{dashboardInsights.ratioSF}</div>
                <div style={{ fontSize: 11, color: '#047857' }}>ratio</div>
              </div>
              <div className="insight-card" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.5px' }}>Archived Years</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: '#5b21b6' }}>{dashboardInsights.archivedYearsCount}</div>
                <div style={{ fontSize: 11, color: '#5b21b6' }}>total</div>
              </div>
              <div className="insight-card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.5px' }}>Latest Activity</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: '#1e3a8a', minHeight: 32 }}>
                  {dashboardInsights.latestActivity ? dashboardInsights.latestActivity.description : 'None yet'}
                </div>
                <div style={{ fontSize: 11, color: '#1e3a8a' }}>{dashboardInsights.latestActivity ? formatTimeAgo(dashboardInsights.latestActivity.timestamp) : ''}</div>
              </div>
            </div>

            {/* Admin Quick Actions below insights */}
            <div className="dashboard-quick-actions" style={{ marginTop: 16 }}>
              <div className="prog-header" style={{ marginBottom: 10 }}>
                <div className="prog-title">Admin Quick Actions</div>
                <div className="prog-sub">Jump to common tasks</div>
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))' }}>
                {[
                  { key: 'students', label: 'Manage Students', sub: 'Add, view, update', icon: '👨‍🎓', action: () => go('/students') },
                  { key: 'faculty', label: 'Manage Faculty', sub: 'Add, view, update', icon: '👩‍🏫', action: () => go('/faculty') },
                  { key: 'courses', label: 'Manage Courses', sub: 'Create & edit', icon: '📚', action: () => go('/courses') },
                  { key: 'programs', label: 'Manage Programs', sub: 'Departments', icon: '🏢', action: () => go('/departments') },
                  { key: 'settings', label: 'Settings', sub: 'Academic years', icon: '⚙️', action: () => go('/settings') },
                  { key: 'clear', label: 'Clear Local Cache', sub: 'Force refresh', icon: '🧹', action: () => clearLocalCaches() },
                ].map((qa) => (
                  <button
                    key={qa.key}
                    onClick={qa.action}
                    onMouseEnter={() => setHoveredQA(qa.key)}
                    onMouseLeave={() => setHoveredQA('')}
                    className="qa-card"
                    style={{
                      textAlign: 'left',
                      borderRadius: 14,
                      padding: '12px 14px',
                      background: hoveredQA === qa.key ? 'linear-gradient(180deg,#ffffff, #f1f5f9)' : '#fff',
                      boxShadow: hoveredQA === qa.key ? '0 10px 18px rgba(0,0,0,.10)' : '0 2px 10px rgba(0,0,0,.06)',
                      border: '1px solid #e5e7eb',
                      transition: 'transform .15s ease, box-shadow .15s ease, background .2s ease',
                      transform: hoveredQA === qa.key ? 'translateY(-2px)' : 'translateY(0)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: hoveredQA === qa.key ? 'linear-gradient(135deg,#6366f1,#22c55e)' : 'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
                        boxShadow: hoveredQA === qa.key ? 'inset 0 0 0 1px rgba(255,255,255,.35)' : 'inset 0 0 0 1px rgba(0,0,0,.05)'
                      }}>
                        <span style={{ fontSize: 18 }}>{qa.icon}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{qa.label}</div>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>{qa.sub}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;