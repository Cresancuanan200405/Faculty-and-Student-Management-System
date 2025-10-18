
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axiosLib from 'axios';

// Reports & Analytics page
// Design mirrors Departments.js (banner, stat cards, tabs, controls, table)
// Requirements:
// - Remove GPA column
// - Add filters: Course, Department, Student ID, Status
// - Fetch options from existing endpoints
// - Student ID filter: dropdown from 1..max existing ID ("ID <= N")

const Reports = () => {
	// Prefer globally-configured axios (with baseURL/auth) when available
	const http = (typeof window !== 'undefined' && window.axios) ? window.axios : axiosLib;

	// Normalizer to handle various API response shapes
	const normalizeArray = useCallback((res, key) => {
		try {
			const d = res?.data ?? res;
			if (Array.isArray(d)) return d;
			if (Array.isArray(d?.data)) return d.data;
			if (Array.isArray(d?.data?.data)) return d.data.data;
			if (key && Array.isArray(d?.[key])) return d[key];
			// common keys
			if (Array.isArray(d?.items)) return d.items;
			if (Array.isArray(d?.results)) return d.results;
			if (Array.isArray(d?.records)) return d.records;
			// find first array in object
			const firstArray = Object.values(d || {}).find(v => Array.isArray(v));
			return Array.isArray(firstArray) ? firstArray : [];
		} catch (err) {
			console.warn('normalizeArray failed:', err);
			return [];
		}
	}, []);
	// Data
	const [students, setStudents] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [courses, setCourses] = useState([]);
	const [faculty, setFaculty] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// UI State
	const [activeTab, setActiveTab] = useState('Student Reports');
	// Department and School Year filters (students)
	const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
	const [selectedYear, setSelectedYear] = useState('All School Years');
	// Faculty-specific Department and School Year filters
	const [facultyDepartment, setFacultyDepartment] = useState('All Departments');
	const [facultyYear, setFacultyYear] = useState('All School Years');
	// Search term for students
	const [searchTerm, setSearchTerm] = useState('');
	// Search term for faculty
	const [facultySearchTerm, setFacultySearchTerm] = useState('');
	// Debounced term for smoother UX
	const [debouncedTerm, setDebouncedTerm] = useState('');
	const [facultyDebouncedTerm, setFacultyDebouncedTerm] = useState('');

	// Color helpers for department-themed badges
	const hexToRgba = useCallback((hex, alpha = 0.14) => {
		try {
			const h = String(hex || '').replace('#', '');
			const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
			const n = parseInt(v, 16);
			const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		} catch { return `rgba(0,0,0,${alpha})`; }
	}, []);

	const departmentColors = useMemo(() => ({
		'arts and sciences': { accent: '#10b981' }, // Light Green
		'accountancy': { accent: '#3b82f6' }, // Light Blue
		'business administration': { accent: '#facc15' }, // Light Yellow
		'criminal justice education': { accent: '#ef4444' }, // Red
		'computer studies': { accent: '#8b5cf6' }, // Violet
		'engineering technology': { accent: '#f59e0b' }, // Orange
		'law': { accent: '#6b7280' }, // Gray
		'nursing': { accent: '#2563eb' }, // Blue
		'teacher education': { accent: '#16a34a' }, // Green
		'tourism and hospitality management': { accent: '#2563eb', gradient: 'linear-gradient(90deg, rgba(37,99,235,0.10), rgba(250,204,21,0.16))' } // Blue-Yellow
	}), []);

	const getDeptBadgeStyle = useCallback((deptName) => {
		const key = String(deptName || '').trim().toLowerCase();
		const conf = departmentColors[key];
		if (!conf) {
			return {
				background: '#0ea5e9',
				color: '#fff',
				border: 'none'
			};
		}
		const bg = conf.gradient || hexToRgba(conf.accent, 0.14);
		return {
			background: bg,
			color: conf.accent,
			border: `1px solid ${hexToRgba(conf.accent, 0.25)}`
		};
	}, [departmentColors, hexToRgba]);

	// Debounce search input
	useEffect(() => {
		const t = setTimeout(() => setDebouncedTerm(searchTerm), 300);
		return () => clearTimeout(t);
	}, [searchTerm]);

	// Debounce faculty search input
	useEffect(() => {
		const t = setTimeout(() => setFacultyDebouncedTerm(facultySearchTerm), 300);
		return () => clearTimeout(t);
	}, [facultySearchTerm]);

	// Loaders
	const loadStudents = useCallback(async () => {
		try {
			const { data } = await http.get('/api/students');
			// Normalize a variety of shapes: [], {data: []}, {students: []}, {data: {data: []}}, etc.
			const list = normalizeArray(data, 'students');
			setStudents(list);
		} catch (e) {
			console.warn('Failed to load students', e);
			setError('Failed to load students');
		}
	}, [http, normalizeArray]);

	const loadDepartments = useCallback(async () => {
		try {
			const { data } = await http.get('/api/departments');
			setDepartments(normalizeArray(data, 'departments'));
		} catch (e) {
			console.warn('Failed to load departments', e);
		}
	}, [http, normalizeArray]);

	const loadCourses = useCallback(async () => {
		try {
			const { data } = await http.get('/api/courses');
			setCourses(normalizeArray(data, 'courses'));
		} catch (e) {
			console.warn('Failed to load courses', e);
		}
	}, [http, normalizeArray]);

	const loadFaculty = useCallback(async () => {
		try {
			const { data } = await http.get('/api/faculty');
			setFaculty(normalizeArray(data, 'faculty'));
		} catch (e) {
			console.warn('Failed to load faculty', e);
		}
	}, [http, normalizeArray]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			await Promise.allSettled([
				loadStudents(),
				loadDepartments(),
				loadCourses(),
				loadFaculty(),
			]);
			if (mounted) setLoading(false);
		})();
		return () => { mounted = false; };
	}, [loadStudents, loadDepartments, loadCourses, loadFaculty]);

	// Derive School Year options from loaded students
	const schoolYearOptions = useMemo(() => {
		const set = new Set();
		(students || []).forEach(s => {
			if (s?.academic_year) set.add(String(s.academic_year));
		});
		return Array.from(set).sort((a, b) => String(b).localeCompare(String(a)));
	}, [students]);

	// Derive School Year options from loaded faculty
	const facultyYearOptions = useMemo(() => {
		const set = new Set();
		(faculty || []).forEach(f => {
			if (f?.academic_year) set.add(String(f.academic_year));
		});
		return Array.from(set).sort((a, b) => String(b).localeCompare(String(a)));
	}, [faculty]);

	// Derive Department options from loaded faculty (ordered to match Faculty.js)
	const facultyDeptOrder = useMemo(() => ([
		"Major Leadership / Administrative Positions",
		"Academic / Teaching Positions",
		"Support, Non-Academic / Administrative Roles",
		"Student Assistant Position",
	]), []);

	const facultyDepartmentOptions = useMemo(() => {
		const uniq = new Set();
		(faculty || []).forEach(f => {
			if (f?.department) uniq.add(String(f.department));
		});
		const options = Array.from(uniq);
		const orderIndex = new Map(facultyDeptOrder.map((n, i) => [n.toLowerCase(), i]));
		options.sort((a, b) => {
			const ai = orderIndex.has(a.toLowerCase()) ? orderIndex.get(a.toLowerCase()) : 999;
			const bi = orderIndex.has(b.toLowerCase()) ? orderIndex.get(b.toLowerCase()) : 999;
			if (ai !== bi) return ai - bi;
			return a.localeCompare(b);
		});
		return options;
	}, [faculty, facultyDeptOrder]);

	// Intentionally no default selection: empty means no filter applied

	// No ID dropdown options anymore; Student ID uses search term

	// Filtering
	const filteredStudents = useMemo(() => {
		const term = debouncedTerm.trim().toLowerCase();

		const matchesGlobal = (s) => {
			if (!term) return true;
			const fullName = [s?.first_name, s?.last_name].filter(Boolean).join(' ').toLowerCase();
			const idStr = String(s?.id || '').toLowerCase();
			const emailStr = String(s?.email || '').toLowerCase();
			const deptStr = String(s?.department || '').toLowerCase();
			const courseStr = (s?.course_code || s?.course || s?.program || '').toLowerCase();
			const yearStr = String(s?.academic_year || s?.year || '').toLowerCase();
			return (
				fullName.includes(term) ||
				idStr.includes(term) ||
				emailStr.includes(term) ||
				deptStr.includes(term) ||
				courseStr.includes(term) ||
				yearStr.includes(term)
			);
		};

		return students.filter(s => {
			// Department filter
			if (selectedDepartment && selectedDepartment !== 'All Departments') {
				if (String(s?.department || '') !== String(selectedDepartment)) return false;
			}
			// School Year filter
			if (selectedYear && selectedYear !== 'All School Years') {
				if (String(s?.academic_year || '') !== String(selectedYear)) return false;
			}
			// Global search
			return matchesGlobal(s);
		});
	}, [students, selectedDepartment, selectedYear, debouncedTerm]);

	// Filtering for faculty (sorted by lowest ID to highest)
	const filteredFaculty = useMemo(() => {
		const term = facultyDebouncedTerm.trim().toLowerCase();

		const matchesGlobal = (f) => {
			if (!term) return true;
			const fullName = [f?.first_name, f?.last_name].filter(Boolean).join(' ').toLowerCase();
			const idStr = String(f?.id || '').toLowerCase();
			const emailStr = String(f?.email || '').toLowerCase();
			const deptStr = String(f?.department || '').toLowerCase();
			const programStr = (f?.assigned_program || f?.program || '').toLowerCase();
			const yearStr = String(f?.academic_year || '').toLowerCase();
			return (
				fullName.includes(term) ||
				idStr.includes(term) ||
				emailStr.includes(term) ||
				deptStr.includes(term) ||
				programStr.includes(term) ||
				yearStr.includes(term)
			);
		};

		const list = faculty.filter(f => {
			// Department filter
			if (facultyDepartment && facultyDepartment !== 'All Departments') {
				if (String(f?.department || '') !== String(facultyDepartment)) return false;
			}
			// School Year filter
			if (facultyYear && facultyYear !== 'All School Years') {
				if (String(f?.academic_year || '') !== String(facultyYear)) return false;
			}
			// Global search
			return matchesGlobal(f);
		});
		// Sort by ID ascending
		list.sort((a, b) => (Number(a?.id) || 0) - (Number(b?.id) || 0));
		return list;
	}, [faculty, facultyDepartment, facultyYear, facultyDebouncedTerm]);

	// Static placeholder
	const searchPlaceholder = useMemo(() => {
		return 'Search by name, email, ID, department, course, or school year…';
	}, []);

	// Stats
	const totalStudents = students.length;
	const totalFaculty = faculty.length;
	const reportsGenerated = filteredStudents.length; // using current results as a proxy

	const currentAcademicYear = useMemo(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth(); // 0-11
		// Assume academic year starts in August (month 7)
		if (m >= 7) {
			return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
		} else {
			return `${y - 1}-${String(y % 100).padStart(2, '0')}`;
		}
	}, []);

	// Export CSV of filtered
	const exportCSV = () => {
		if (!filteredStudents.length) return;
		const headers = ['Student ID', 'Name', 'Course', 'Department', 'School Year', 'Status'];
		const rows = filteredStudents.map(s => {
			const name = [s?.first_name, s?.last_name].filter(Boolean).join(' ');
			const course = s?.course_code || s?.course || s?.program || '';
			const dept = s?.department || '';
			const sy = s?.academic_year || s?.year || '';
			const status = s?.status || '';
			return [s?.id, name, course, dept, sy, status];
		});
		const csv = [headers, ...rows]
			.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
			.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `student_reports_${Date.now()}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	// Export CSV of filtered faculty
	const exportFacultyCSV = () => {
		if (!filteredFaculty.length) return;
		const headers = ['Faculty ID', 'Name', 'Program', 'Department', 'School Year', 'Status'];
		const rows = filteredFaculty.map(f => {
			const name = [f?.first_name, f?.last_name].filter(Boolean).join(' ');
			const program = f?.assigned_program || f?.program || '';
			const dept = f?.department || '';
			const sy = f?.academic_year || '';
			const status = f?.status || '';
			return [f?.id, name, program, dept, sy, status];
		});
		const csv = [headers, ...rows]
			.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
			.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `faculty_reports_${Date.now()}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	// Helpers for UI pills/badges
	const renderCourseBadge = (text, dept) => {
		if (!text) return <span>—</span>;
		const themed = getDeptBadgeStyle(dept);
		return (
			<span
				style={{
					display: 'inline-block',
					padding: '4px 10px',
					borderRadius: 999,
					fontSize: 12,
					fontWeight: 700,
					boxShadow: '0 1px 3px #0002',
					...themed,
				}}
				title={String(text)}
			>
				{text}
			</span>
		);
	};

	const renderStatusPill = (status) => {
		const s = String(status || '').toLowerCase();
		const bg = s === 'active' ? '#16a34a' : s === 'inactive' ? '#f59e0b' : '#6b7280';
		return (
			<span
				className={`status-pill ${s}`}
				style={{ background: `${bg}22`, color: bg, border: `1px solid ${bg}44` }}
			>
				{status || '—'}
			</span>
		);
	};

	return (
		<div className="departments-root">{/* reuse styles from Departments.scss for consistent look */}
			{/* Banner */}
			<div className="departments-banner" style={{ marginBottom: 16 }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
					<div
						style={{
							width: 64,
							height: 64,
							background: 'linear-gradient(135deg,#2563eb,#10b981)',
							borderRadius: '50%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 2px 6px #0002',
							overflow: 'hidden',
							flexShrink: 0,
							marginLeft: -16,
						}}
					>
						<img
							src="/images/Report_Manager.png"
							alt="Reports icon"
							style={{ width: '60%', height: '60%', objectFit: 'cover' }}
						/>
					</div>
					<div className="departments-banner-content">
						<div className="departments-banner-title">Reports & Analytics</div>
						<div className="departments-banner-sub">FSUU - Generate comprehensive reports for students and faculty</div>
					</div>
				</div>
			</div>

			{/* Stat cards */}
			<div className="departments-stats-row" style={{ marginTop: 8 }}>
				<div className="departments-stat-card bg-sky">
					<div className="departments-stat-value">{totalStudents.toLocaleString()}</div>
					<div className="departments-stat-label">Total Students</div>
					<div className="departments-stat-sub">Across all programs</div>
				</div>
				<div className="departments-stat-card bg-mint">
					<div className="departments-stat-value">{totalFaculty.toLocaleString()}</div>
					<div className="departments-stat-label">Total Faculty</div>
					<div className="departments-stat-sub">Active faculty members</div>
				</div>
				<div className="departments-stat-card bg-sun">
					<div className="departments-stat-value">{reportsGenerated.toLocaleString()}</div>
					<div className="departments-stat-label">Reports Generated</div>
					<div className="departments-stat-sub">This session</div>
				</div>
				<div className="departments-stat-card bg-sky-2">
					<div className="departments-stat-value">{currentAcademicYear}</div>
					<div className="departments-stat-label">Academic Year</div>
					<div className="departments-stat-sub">Current period</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="departments-controls" style={{ marginTop: 8 }}>
				<div className="departments-tabs">
					<button
						className={`departments-tab ${activeTab === 'Student Reports' ? 'active' : ''}`}
						onClick={() => setActiveTab('Student Reports')}
					>
						Student Reports
					</button>
					<button
						className={`departments-tab ${activeTab === 'Faculty Reports' ? 'active' : ''}`}
						onClick={() => setActiveTab('Faculty Reports')}
					>
						Faculty Reports
					</button>
				</div>
			</div>

			{/* Main section */}
			{activeTab === 'Student Reports' && (
				<div className="departments-main-section">
					<div className="departments-section-header">
						<div>
							<h2 className="departments-section-title">Student Reports</h2>
							<p className="departments-section-subtitle">Generate detailed reports for students with flexible filters</p>
						</div>
						<button className="add-department-btn" onClick={exportCSV} title="Export CSV">
							Export Report
						</button>
					</div>

					{/* Filters row */}
					<div className="departments-ui-filters" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
						{/* Department select (replaces previous filter-type) */}
						<div className="reports-filter-type">
							<select
								id="reports-department-select"
								className="reports-select"
								value={selectedDepartment}
								onChange={e => setSelectedDepartment(e.target.value)}
								aria-label="Department"
							>
								<option value="All Departments">All Departments</option>
								{(departments || []).map((d) => (
									<option key={d.id ?? d.name} value={d.name}>{d.name}</option>
								))}
							</select>
						</div>

						{/* School Year select */}
						<div className="reports-filter-type">
							<select
								id="reports-year-select"
								className="reports-select"
								value={selectedYear}
								onChange={e => setSelectedYear(e.target.value)}
								aria-label="School Year"
							>
								<option value="All School Years">All School Years</option>
								{schoolYearOptions.map((y) => (
									<option key={y} value={y}>{y}</option>
								))}
							</select>
						</div>

						{/* Search students */}
						<div className="reports-search">
							<span className="reports-search-icon" aria-hidden>
								<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
									<circle cx="11" cy="11" r="8"/>
									<path d="M21 21l-4.35-4.35"/>
								</svg>
							</span>
							<input
								className="reports-search-input"
								placeholder={searchPlaceholder}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								type="text"
							/>
							{searchTerm && (
								<button
									type="button"
									className="reports-clear"
									onClick={() => setSearchTerm('')}
									aria-label="Clear search"
								>
									×
								</button>
							)}
						</div>

						<div className="reports-count">
							<span className="reports-filter-mode">{selectedDepartment}</span>
							<span className="reports-filter-mode">{selectedYear}</span>
							<span className="reports-count-text">{filteredStudents.length} students found</span>
						</div>
					</div>

					{/* Table */}
					<div className="departments-ui-table-wrap">
						{error && <div className="departments-ui-error">{error}</div>}
						<table className="departments-ui-table">
							<thead>
								<tr>
									<th>Student ID</th>
									<th>Name</th>
									<th>Course</th>
									<th>Department</th>
									<th>School Year</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan="6" className="loading-cell">Loading...</td></tr>
								) : filteredStudents.length ? (
									filteredStudents.map((stu) => {
										const name = [stu?.first_name, stu?.last_name].filter(Boolean).join(' ');
										const course = stu?.course_code || stu?.course || stu?.program || '';
										return (
											<tr key={stu.id}>
												<td><strong>{stu.id}</strong></td>
												<td>{name || '—'}</td>
												<td>{renderCourseBadge(course || '—', stu?.department)}</td>
												<td>
													<span style={{ color: '#2563eb', fontWeight: 600 }}>{stu?.department || '—'}</span>
												</td>
												<td>{stu?.academic_year || '—'}</td>
												<td>{renderStatusPill(stu?.status)}</td>
											</tr>
										);
									})
								) : (
									<tr><td colSpan="6" className="empty-row">No students match your filters</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{activeTab === 'Faculty Reports' && (
				<div className="departments-main-section">
					<div className="departments-section-header">
						<div>
							<h2 className="departments-section-title">Faculty Reports</h2>
							<p className="departments-section-subtitle">Generate detailed reports for faculty with flexible filters</p>
						</div>
						<button className="add-department-btn" onClick={exportFacultyCSV} title="Export CSV">
							Export Report
						</button>
					</div>

					{/* Filters row */}
					<div className="departments-ui-filters" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
						{/* Department select (from faculty) */}
						<div className="reports-filter-type">
							<select
								id="faculty-department-select"
								className="reports-select"
								value={facultyDepartment}
								onChange={e => setFacultyDepartment(e.target.value)}
								aria-label="Department"
							>
								<option value="All Departments">All Departments</option>
								{facultyDepartmentOptions.map((name) => (
									<option key={name} value={name}>{name}</option>
								))}
							</select>
						</div>

						{/* School Year select */}
						<div className="reports-filter-type">
							<select
								id="faculty-year-select"
								className="reports-select"
								value={facultyYear}
								onChange={e => setFacultyYear(e.target.value)}
								aria-label="School Year"
							>
								<option value="All School Years">All School Years</option>
								{facultyYearOptions.map((y) => (
									<option key={y} value={y}>{y}</option>
								))}
							</select>
						</div>

						{/* Search faculty */}
						<div className="reports-search">
							<span className="reports-search-icon" aria-hidden>
								<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
									<circle cx="11" cy="11" r="8"/>
									<path d="M21 21l-4.35-4.35"/>
								</svg>
							</span>
							<input
								className="reports-search-input"
								placeholder={'Search by name, email, ID, department, program, or school year…'}
								value={facultySearchTerm}
								onChange={e => setFacultySearchTerm(e.target.value)}
								type="text"
							/>
							{facultySearchTerm && (
								<button
									type="button"
									className="reports-clear"
									onClick={() => setFacultySearchTerm('')}
									aria-label="Clear search"
								>
									×
								</button>
							)}
						</div>

						<div className="reports-count">
							<span className="reports-filter-mode">{facultyDepartment}</span>
							<span className="reports-filter-mode">{facultyYear}</span>
							<span className="reports-count-text">{filteredFaculty.length} faculty found</span>
						</div>
					</div>

					{/* Table */}
					<div className="departments-ui-table-wrap">
						{error && <div className="departments-ui-error">{error}</div>}
						<table className="departments-ui-table">
							<thead>
								<tr>
									<th>Faculty ID</th>
									<th>Name</th>
									<th>Program</th>
									<th>Department</th>
									<th>School Year</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan="6" className="loading-cell">Loading...</td></tr>
								) : filteredFaculty.length ? (
									filteredFaculty.map((f) => {
										const name = [f?.first_name, f?.last_name].filter(Boolean).join(' ');
										const program = f?.assigned_program || f?.program || '';
										return (
											<tr key={f.id}>
												<td><strong>{f.id}</strong></td>
												<td>{name || '—'}</td>
												<td>{renderCourseBadge(program || '—', f?.department)}</td>
												<td>
													<span style={{ color: '#2563eb', fontWeight: 600 }}>{f?.department || '—'}</span>
												</td>
												<td>{f?.academic_year || '—'}</td>
												<td>{renderStatusPill(f?.status)}</td>
											</tr>
										);
									})
								) : (
									<tr><td colSpan="6" className="empty-row">No faculty match your filters</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
};

export default Reports;
