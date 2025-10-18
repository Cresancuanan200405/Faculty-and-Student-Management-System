
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
	// Single merged filter selects the filter TYPE only
	// Values: 'all' | 'course' | 'department' | 'student_id'
	const [filterValue, setFilterValue] = useState('all');
	// Search term for students (name or id)
	const [searchTerm, setSearchTerm] = useState('');
	// Debounced term for smoother UX
	const [debouncedTerm, setDebouncedTerm] = useState('');

	// Debounce search input
	useEffect(() => {
		const t = setTimeout(() => setDebouncedTerm(searchTerm), 300);
		return () => clearTimeout(t);
	}, [searchTerm]);

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

	// Options removed (no longer needed for simplified filter UI)

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
			return (
				fullName.includes(term) ||
				idStr.includes(term) ||
				emailStr.includes(term) ||
				deptStr.includes(term) ||
				courseStr.includes(term)
			);
		};

		return students.filter(s => {
			if (filterValue === 'all') {
				// Global search only
				return matchesGlobal(s);
			}

			if (filterValue === 'course') {
				if (!term) return true; // no filter if term empty
				const courseStr = (s?.course_code || s?.course || s?.program || '').toLowerCase();
				return courseStr.includes(term);
			}

			if (filterValue === 'department') {
				if (!term) return true; // no filter if term empty
				const deptStr = String(s?.department || '').toLowerCase();
				return deptStr.includes(term);
			}

			if (filterValue === 'student_id') {
				const maxId = Number(term);
				if (!term || !Number.isFinite(maxId) || maxId <= 0) return true; // no filter if term empty/invalid
				const id = Number(s?.id) || 0;
				return id >= 1 && id <= maxId;
			}

			return true;
		});
	}, [students, filterValue, debouncedTerm]);

	// Dynamic placeholder based on filter type
	const searchPlaceholder = useMemo(() => {
		switch (filterValue) {
			case 'course':
				return 'Filter by course or program…';
			case 'department':
				return 'Filter by department…';
			case 'student_id':
				return 'Show students with ID up to… (e.g., 50)';
			default:
				return 'Search by name, email, ID, department, or course…';
		}
	}, [filterValue]);

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
		const headers = ['Student ID', 'Name', 'Course', 'Department', 'Status'];
		const rows = filteredStudents.map(s => {
			const name = [s?.first_name, s?.last_name].filter(Boolean).join(' ');
			const course = s?.course_code || s?.course || s?.program || '';
			const dept = s?.department || '';
			const status = s?.status || '';
			return [s?.id, name, course, dept, status];
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

	// Helpers for UI pills/badges
	const renderCourseBadge = (text) => (
		<span
			style={{
				display: 'inline-block',
				padding: '4px 10px',
				borderRadius: 999,
				background: '#0ea5e9',
				color: '#fff',
				fontSize: 12,
				fontWeight: 700,
				boxShadow: '0 1px 3px #0002'
			}}
		>
			{text}
		</span>
	);

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
						{/* simple doc icon */}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" opacity=".6"/>
							<path d="M14 2v6h6"/>
						</svg>
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

					{/* Filters row (merged) */}
					<div className="departments-ui-filters" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
						{/* Single dropdown for filter TYPE only */}
						<div className="reports-filter-type">
							<label className="reports-filter-label" htmlFor="reports-filter-select">Filter</label>
							<select
								id="reports-filter-select"
								className="reports-select"
								value={filterValue}
								onChange={e => setFilterValue(e.target.value)}
							>
							<option value="all">All Students</option>
							<option value="course">Course</option>
							<option value="department">Department</option>
							<option value="student_id">Student ID</option>
							</select>
						</div>

						{/* Search students by name or ID */}
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
								onChange={e => {
									if (filterValue === 'student_id') {
										const v = e.target.value.replace(/[^\d]/g, '');
										setSearchTerm(v);
									} else {
										setSearchTerm(e.target.value);
									}
								}}
								type={filterValue === 'student_id' ? 'number' : 'text'}
								inputMode={filterValue === 'student_id' ? 'numeric' : undefined}
								min={filterValue === 'student_id' ? 1 : undefined}
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
							<span className="reports-filter-mode">{filterValue === 'all' ? 'All Students' : filterValue === 'course' ? 'Course' : filterValue === 'department' ? 'Department' : 'Student ID'}</span>
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
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan="5" className="loading-cell">Loading...</td></tr>
								) : filteredStudents.length ? (
									filteredStudents.map((stu) => {
										const name = [stu?.first_name, stu?.last_name].filter(Boolean).join(' ');
										const course = stu?.course_code || stu?.course || stu?.program || '';
										return (
											<tr key={stu.id}>
												<td><strong>{stu.id}</strong></td>
												<td>{name || '—'}</td>
												<td>{renderCourseBadge(course || '—')}</td>
												<td>
													<span style={{ color: '#2563eb', fontWeight: 600 }}>{stu?.department || '—'}</span>
												</td>
												<td>{renderStatusPill(stu?.status)}</td>
											</tr>
										);
									})
								) : (
									<tr><td colSpan="5" className="empty-row">No students match your filters</td></tr>
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
							<p className="departments-section-subtitle">Generate faculty-related reports (coming soon)</p>
						</div>
					</div>
					<div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 24 }}>
						<p style={{ color: '#64748b' }}>
							Use the Student Reports tab for now. We can extend this section with similar filters for faculty once endpoints are confirmed.
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default Reports;
