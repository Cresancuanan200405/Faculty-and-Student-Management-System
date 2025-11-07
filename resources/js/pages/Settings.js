
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import "../../sass/Settings.scss";
import notifications from '../utils/notifications';
// Settings & Preferences page
// Mirrors the design/structure of Reports.js (banner, stat cards, tabs, filters, table, CSV export)
// Safe defaults and guarded network calls so it compiles and runs even without a settings API.

const Settings = () => {
	// Use axios directly instead of global window.axios
	const http = axios;

	// Data states
	const [courses, setCourses] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [academicYears, setAcademicYears] = useState([]);
	const [students, setStudents] = useState([]);
	const [faculty, setFaculty] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Modal states
	const [showModal, setShowModal] = useState(false);
	const [modalType, setModalType] = useState(''); // 'course', 'department', 'academic_year'
	const [editingItem, setEditingItem] = useState(null);
	const [saving, setSaving] = useState(false);

	// Archive/Restore confirmation modals (generic for Academic Years, Courses, Departments)
	const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
	const [archiveTarget, setArchiveTarget] = useState({ item: null, type: '' });
	const [archiveConfirmText, setArchiveConfirmText] = useState("");
	const [archiveInProgress, setArchiveInProgress] = useState(false);
	const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
	const [restoreTarget, setRestoreTarget] = useState({ item: null, type: '' });
	const [restoreConfirmText, setRestoreConfirmText] = useState("");
	const [restoreInProgress, setRestoreInProgress] = useState(false);

	// Delete confirmation (Academic Year only for now)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null); // academic year item
	const [deleteConfirmText, setDeleteConfirmText] = useState("");
	const [deleteInProgress, setDeleteInProgress] = useState(false);

	// Form states
	const [courseForm, setCourseForm] = useState({
		name: '',
		description: '',
		credits: '',
		program: '',
		instructor: '',
		status: 'Active',
		max_students: ''
	});

	const [departmentForm, setDepartmentForm] = useState({
		name: '',
		description: '',
		budget: '',
		status: 'Active'
	});

	const [academicYearForm, setAcademicYearForm] = useState({
		academic_year: '',
		status: 'Active',
		targets: ['Students']
	});

	// UI State
	const [activeTab, setActiveTab] = useState('Courses');

	// Filters
	const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
	const [selectedStatus, setSelectedStatus] = useState('All Statuses');
	const [selectedSource, setSelectedSource] = useState('All'); // All | Students | Faculty
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedTerm, setDebouncedTerm] = useState('');
	const [showArchived, setShowArchived] = useState(false);
	const [courseSelectionMode, setCourseSelectionMode] = useState(false);
	const [selectedCourseIds, setSelectedCourseIds] = useState(() => new Set());
	const [departmentSelectionMode, setDepartmentSelectionMode] = useState(false);
	const [selectedDepartmentIds, setSelectedDepartmentIds] = useState(() => new Set());
	const [yearSelectionMode, setYearSelectionMode] = useState(false);
	const [selectedYearIds, setSelectedYearIds] = useState(() => new Set());
	const [bulkConfirm, setBulkConfirm] = useState({ show: false, subject: '', action: '', ids: [] });
	const [bulkConfirmText, setBulkConfirmText] = useState('');
	const [bulkConfirmInProgress, setBulkConfirmInProgress] = useState(false);

	// Debounce search input
	useEffect(() => {
		const t = setTimeout(() => setDebouncedTerm(searchTerm), 300);
		return () => clearTimeout(t);
	}, [searchTerm]);

	useEffect(() => {
		setSelectedCourseIds(new Set());
		setSelectedDepartmentIds(new Set());
		setSelectedYearIds(new Set());
		setCourseSelectionMode(false);
		setDepartmentSelectionMode(false);
		setYearSelectionMode(false);
	}, [activeTab, showArchived]);

	// Optional loader (guarded) — if /api/courses, /api/departments, /api/academic-years exist, they will populate; otherwise placeholders stay
	const loadCourses = useCallback(async () => {
		try {
			const { data } = await http.get('/api/courses');
			setCourses(data.courses || []);
		} catch (e) {
			console.error('Failed to fetch courses:', e);
			setError('Failed to load courses');
		}
	}, [http]);

	const loadDepartments = useCallback(async () => {
		try {
			const { data } = await http.get('/api/departments');
			setDepartments(data.departments || []);
		} catch (e) {
			console.error('Failed to fetch departments:', e);
			setError('Failed to load departments');
		}
	}, [http]);

	const loadStudents = useCallback(async () => {
		try {
			const { data } = await http.get('/api/students');
			setStudents(data.students || []);
		} catch (e) {
			console.error('Failed to fetch students:', e);
		}
	}, [http]);

	const loadFaculty = useCallback(async () => {
		try {
			const { data } = await http.get('/api/faculty');
			setFaculty(data.faculty || []);
		} catch (e) {
			console.error('Failed to fetch faculty:', e);
		}
	}, [http]);

	const loadAcademicYears = useCallback(async () => {
		// Extract academic years from students and faculty data
		const studentYears = new Set();
		const facultyYears = new Set();

		(students || []).forEach(student => {
			if (student?.academic_year) {
				let rawYear = String(student.academic_year).replace(/^SY\s*/, "").trim();
				if (/^\d{4}-\d{4}$/.test(rawYear)) {
					studentYears.add(`${rawYear}`);
				} else if (/^\d{4}$/.test(rawYear)) {
					const start = Number(rawYear);
					studentYears.add(`${start}-${start + 1}`);
				}
			}
		});

		(faculty || []).forEach(member => {
			if (member?.academic_year) {
				let rawYear = String(member.academic_year).replace(/^SY\s*/, "").trim();
				if (/^\d{4}-\d{4}$/.test(rawYear)) {
					facultyYears.add(`${rawYear}`);
				} else if (/^\d{4}$/.test(rawYear)) {
					const start = Number(rawYear);
					facultyYears.add(`${start}-${start + 1}`);
				}
			}
		});

		// Add some default years
		const defaultYears = [
			"2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026"
		];

		const combinedYears = new Set([...studentYears, ...facultyYears, ...defaultYears]);

		let savedStatuses = {};
		try {
			savedStatuses = JSON.parse(localStorage.getItem('settings_academic_year_statuses') || '{}');
		} catch (_) {}

		const academicYearsList = Array.from(combinedYears).sort().map((year, index) => ({
			id: index + 1,
			academic_year: year,
			status: savedStatuses[year] || (year === '2024-2025' ? 'Active' : 'Inactive'),
			hasStudents: studentYears.has(year),
			hasFaculty: facultyYears.has(year)
		}));

		setAcademicYears(academicYearsList);
	}, [students, faculty]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			await Promise.allSettled([loadCourses(), loadDepartments(), loadStudents(), loadFaculty()]);
			if (mounted) setLoading(false);
		})();
		return () => { mounted = false; };
	}, [loadCourses, loadDepartments, loadStudents, loadFaculty]);

	// Load academic years after students or faculty data is loaded
	useEffect(() => {
		loadAcademicYears();
	}, [students, faculty, loadAcademicYears]);

	// Reflect SY folders added from Students/Faculty immediately in Academic Years
	useEffect(() => {
		const onAcademicYearAdded = (e) => {
			try {
				const detail = e?.detail || {};
				const label = detail.label; // e.g., "SY 2025-2026"
				const target = detail.target === 'Faculty' ? 'Faculty' : 'Students';
				if (!label) return;
				const year = String(label).replace(/^SY\s*/i, '').trim();

				// Ensure status map includes this year (default Active)
				let statusMap = {};
				try { statusMap = JSON.parse(localStorage.getItem('settings_academic_year_statuses') || '{}'); } catch {}
				if (!statusMap[year]) {
					statusMap[year] = 'Active';
					localStorage.setItem('settings_academic_year_statuses', JSON.stringify(statusMap));
					window.dispatchEvent(new CustomEvent('academicYearStatusUpdated', { detail: { year, status: 'Active' } }));
				}
				const status = statusMap[year] || 'Active';

				setAcademicYears((prev = []) => {
					const idx = prev.findIndex(ay => String(ay.academic_year) === year);
					if (idx !== -1) {
						const existing = prev[idx];
						const updated = {
							...existing,
							status: existing.status || status,
							hasStudents: existing.hasStudents || target === 'Students',
							hasFaculty: existing.hasFaculty || target === 'Faculty'
						};
						const cloned = prev.slice();
						cloned[idx] = updated;
						return cloned;
					}
					return [
						...prev,
						{
							id: (prev.length ? Math.max(...prev.map(p => Number(p.id) || 0)) + 1 : 1),
							academic_year: year,
							status,
							hasStudents: target === 'Students',
							hasFaculty: target === 'Faculty'
						}
					];
				});
			} catch {}
		};
		window.addEventListener('academicYearAdded', onAcademicYearAdded);
		return () => window.removeEventListener('academicYearAdded', onAcademicYearAdded);
	}, [setAcademicYears]);

	// Keep Academic Year statuses in sync when Students/Faculty archive or restore SY folders
	useEffect(() => {
		const STATUS_KEY = 'settings_academic_year_statuses';
		const PREV_STATUS_KEY = 'settings_academic_year_statuses_prev';

		const persistStatus = (year, status, source) => {
			if (!year) return;
			let map = {};
			let prevMap = {};
			try { map = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}'); } catch (_) {}
			try { prevMap = JSON.parse(localStorage.getItem(PREV_STATUS_KEY) || '{}'); } catch (_) {}

			if (status === 'Archived') {
				const current = map[year];
				if (current && current !== 'Archived') {
					prevMap[year] = current;
				} else if (!prevMap[year]) {
					prevMap[year] = 'Active';
				}
			} else if (prevMap[year]) {
				delete prevMap[year];
			}

			map[year] = status;
			try {
				localStorage.setItem(STATUS_KEY, JSON.stringify(map));
				localStorage.setItem(PREV_STATUS_KEY, JSON.stringify(prevMap));
			} catch (_) {}

			window.dispatchEvent(new CustomEvent('academicYearStatusUpdated', {
				detail: { year, status },
				bubbles: true
			}));

			setAcademicYears(prev => {
				const list = Array.isArray(prev) ? prev.slice() : [];
				let found = false;
				let maxId = 0;
				list.forEach(item => {
					const idNum = Number(item?.id);
					if (!Number.isNaN(idNum)) {
						maxId = Math.max(maxId, idNum);
					}
				});

				const next = list.map(item => {
					if (String(item.academic_year) !== year) return item;
					found = true;
					return {
						...item,
						status,
						hasStudents: item.hasStudents || source === 'Students',
						hasFaculty: item.hasFaculty || source === 'Faculty'
					};
				});

				if (!found) {
					next.push({
						id: maxId + 1 || 1,
						academic_year: year,
						status,
						hasStudents: source === 'Students',
						hasFaculty: source === 'Faculty'
					});
				}

				next.sort((a, b) => String(a.academic_year).localeCompare(String(b.academic_year)));
				return next;
			});
		};

		const extractYear = (detail) => {
			const raw = detail?.label ?? detail?.year ?? detail;
			if (!raw) return null;
			const cleaned = String(raw).replace(/^SY\s*/i, '').trim();
			return cleaned || null;
		};

		const handleArchive = (source) => (event) => {
			const year = extractYear(event?.detail);
			if (!year) return;
			persistStatus(year, 'Archived', source);
		};

		const handleRestore = (source) => (event) => {
			const year = extractYear(event?.detail);
			if (!year) return;
			let fallback = 'Active';
			try {
				const prevMap = JSON.parse(localStorage.getItem(PREV_STATUS_KEY) || '{}');
				if (prevMap[year] && prevMap[year] !== 'Archived') {
					fallback = prevMap[year];
				}
			} catch (_) {}
			persistStatus(year, fallback, source);
		};

		const studentArchive = handleArchive('Students');
		const facultyArchive = handleArchive('Faculty');
		const studentRestore = handleRestore('Students');
		const facultyRestore = handleRestore('Faculty');

		window.addEventListener('studentYearArchived', studentArchive);
		window.addEventListener('facultyYearArchived', facultyArchive);
		window.addEventListener('studentYearRestored', studentRestore);
		window.addEventListener('facultyYearRestored', facultyRestore);

		return () => {
			window.removeEventListener('studentYearArchived', studentArchive);
			window.removeEventListener('facultyYearArchived', facultyArchive);
			window.removeEventListener('studentYearRestored', studentRestore);
			window.removeEventListener('facultyYearRestored', facultyRestore);
		};
	}, []);

	// Derived options
	const departmentOptions = useMemo(() => {
		const set = new Set();
		(courses || []).forEach(c => { if (c?.program) set.add(String(c.program)); });
		(departments || []).forEach(d => { if (d?.name) set.add(String(d.name)); });
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [courses, departments]);

	const statusOptions = ['Active', 'Inactive', 'Completed'];

	const getCourseRowKey = useCallback((course) => {
		if (!course) return '';
		if (course.id !== undefined && course.id !== null) {
			return String(course.id);
		}
		const program = String(course.program || '').trim();
		const name = String(course.name || '').trim();
		return `${program}::${name}` || 'course::unknown';
	}, []);

	const getDepartmentRowKey = useCallback((department) => {
		if (!department) return '';
		if (department.id !== undefined && department.id !== null) {
			return String(department.id);
		}
		return String(department.name || '').trim() || 'department::unknown';
	}, []);

	const getAcademicYearRowKey = useCallback((year) => {
		if (!year) return '';
		if (year.id !== undefined && year.id !== null) {
			return String(year.id);
		}
		return String(year.academic_year || '').trim();
	}, []);

	// Filtering functions for each tab
	const filteredCourses = useMemo(() => {
		const term = debouncedTerm.trim().toLowerCase();
		return (courses || []).filter(c => {
			// Filter by archived/active status first
			const isArchived = String(c?.status || '').toLowerCase() === 'archived';
			if (showArchived !== isArchived) return false;
			
			if (selectedDepartment && selectedDepartment !== 'All Departments') {
				if (String(c?.program || '') !== String(selectedDepartment)) return false;
			}
			if (selectedStatus && selectedStatus !== 'All Statuses') {
				const st = String(c?.status || '');
				if (st !== String(selectedStatus)) return false;
			}
			if (term) {
				const nameStr = String(c?.name || '').toLowerCase();
				const progStr = String(c?.program || '').toLowerCase();
				if (!(nameStr.includes(term) || progStr.includes(term))) {
					return false;
				}
			}
			return true;
		});
	}, [courses, selectedDepartment, selectedStatus, debouncedTerm, showArchived]);

	const filteredDepartments = useMemo(() => {
		const term = debouncedTerm.trim().toLowerCase();
		return (departments || []).filter(d => {
			// Filter by archived/active status first
			const isArchived = String(d?.status || '').toLowerCase() === 'archived';
			if (showArchived !== isArchived) return false;
			
			if (selectedStatus && selectedStatus !== 'All Statuses') {
				const st = String(d?.status || '');
				if (st !== String(selectedStatus)) return false;
			}
			if (term) {
				const nameStr = String(d?.name || '').toLowerCase();
				if (!nameStr.includes(term)) {
					return false;
				}
			}
			return true;
		});
	}, [departments, selectedStatus, debouncedTerm, showArchived]);

	const filteredAcademicYears = useMemo(() => {
		const term = debouncedTerm.trim().toLowerCase();
		return (academicYears || []).filter(ay => {
			// Filter by archived/active status first
			const isArchived = String(ay?.status || '').toLowerCase() === 'archived';
			if (showArchived !== isArchived) return false;

			// Filter by source
			if (selectedSource === 'Students' && !ay.hasStudents) return false;
			if (selectedSource === 'Faculty' && !ay.hasFaculty) return false;
			
			if (selectedStatus && selectedStatus !== 'All Statuses') {
				const st = String(ay?.status || '');
				if (st !== String(selectedStatus)) return false;
			}
			if (term) {
				const yearStr = String(ay?.academic_year || '').toLowerCase();
				if (!yearStr.includes(term)) {
					return false;
				}
			}
			return true;
		});
	}, [academicYears, selectedStatus, debouncedTerm, showArchived, selectedSource]);

	const displayedCourseKeys = filteredCourses.map(getCourseRowKey);
	const displayedDepartmentKeys = filteredDepartments.map(getDepartmentRowKey);
	const displayedYearKeys = filteredAcademicYears.map(getAcademicYearRowKey);
	const selectedCoursesCount = selectedCourseIds.size;
	const selectedDepartmentsCount = selectedDepartmentIds.size;
	const selectedYearsCount = selectedYearIds.size;
	const allCoursesSelected = displayedCourseKeys.length > 0 && displayedCourseKeys.every(key => selectedCourseIds.has(key));
	const allDepartmentsSelected = displayedDepartmentKeys.length > 0 && displayedDepartmentKeys.every(key => selectedDepartmentIds.has(key));
	const allYearsSelected = displayedYearKeys.length > 0 && displayedYearKeys.every(key => selectedYearIds.has(key));

	// Modal and form handlers
	const openAddModal = (type) => {
		setModalType(type);
		setEditingItem(null);
		if (type === 'course') {
			setCourseForm({
				name: '',
				description: '',
				credits: '',
				program: '',
				instructor: '',
				status: 'Active',
				max_students: ''
			});
		} else if (type === 'department') {
			setDepartmentForm({
				name: '',
				description: '',
				budget: '',
				status: 'Active'
			});
		} else if (type === 'academic_year') {
			setAcademicYearForm({
				academic_year: '',
					status: 'Active',
					targets: ['Students']
			});
		}
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setModalType('');
		setEditingItem(null);
		setSaving(false);
	};

	const handleCourseFormChange = (e) => {
		const { name, value } = e.target;
		setCourseForm(prev => ({ ...prev, [name]: value }));
	};

	const handleDepartmentFormChange = (e) => {
		const { name, value } = e.target;
		setDepartmentForm(prev => ({ ...prev, [name]: value }));
	};

	const handleAcademicYearFormChange = (e) => {
		const { name, value } = e.target;
		setAcademicYearForm(prev => ({ ...prev, [name]: value }));
	};

	const toggleAcademicYearTarget = (value) => {
		setAcademicYearForm(prev => {
			const current = Array.isArray(prev?.targets) ? prev.targets : [];
			const exists = current.includes(value);
			const nextTargets = exists ? current.filter(t => t !== value) : [...current, value];
			return {
				...prev,
				targets: nextTargets.length ? nextTargets : ['Students']
			};
		});
	};

	const normalizeTargets = (rawTargets) => {
		if (Array.isArray(rawTargets)) {
			const filtered = rawTargets
				.map(t => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
				.filter(t => t === 'students' || t === 'faculty');
			if (!filtered.length) {
				return ['Students'];
			}
			return Array.from(new Set(filtered)).map(t => (t === 'faculty' ? 'Faculty' : 'Students'));
		}
		if (typeof rawTargets === 'string' && rawTargets.trim()) {
			const normalized = rawTargets.trim().toLowerCase();
			if (normalized === 'both' || normalized === 'all') {
				return ['Students', 'Faculty'];
			}
			if (normalized === 'faculty' || normalized === 'students') {
				return [normalized === 'faculty' ? 'Faculty' : 'Students'];
			}
		}
		return ['Students'];
	};

	const resetCourseSelection = () => {
		setCourseSelectionMode(false);
		setSelectedCourseIds(new Set());
	};

	const resetDepartmentSelection = () => {
		setDepartmentSelectionMode(false);
		setSelectedDepartmentIds(new Set());
	};

	const resetYearSelection = () => {
		setYearSelectionMode(false);
		setSelectedYearIds(new Set());
	};

	const closeBulkConfirm = () => {
		setBulkConfirm({ show: false, subject: '', action: '', ids: [] });
		setBulkConfirmText('');
		setBulkConfirmInProgress(false);
	};

	const handleBulkCourseStatus = async (ids, actionType) => {
		if (!ids?.length) return;
		const targetStatus = actionType === 'archive' ? 'Archived' : 'Active';
		const verb = actionType === 'archive' ? 'archived' : 'restored';
		const courseMap = new Map((courses || []).map(course => [getCourseRowKey(course), course]));
		const jobs = ids.map(key => {
			const course = courseMap.get(key);
			if (!course || !course.id) {
				return Promise.reject(new Error('Course not found'));
			}
			const payload = { ...course, status: targetStatus };
			return axios.put(`/api/courses/${course.id}`, payload);
		});
		const results = await Promise.allSettled(jobs);
		const successCount = results.filter(res => res.status === 'fulfilled').length;
		const failureCount = ids.length - successCount;
		if (successCount) {
			notifications.add(`Successfully ${verb} ${successCount} course${successCount === 1 ? '' : 's'}.`);
		}
		if (failureCount) {
			notifications.info(`Failed to ${verb} ${failureCount} course${failureCount === 1 ? '' : 's'}.`);
		}
		await loadCourses();
	};

	const handleBulkDepartmentStatus = async (ids, actionType) => {
		if (!ids?.length) return;
		const targetStatus = actionType === 'archive' ? 'Archived' : 'Active';
		const verb = actionType === 'archive' ? 'archived' : 'restored';
		const departmentMap = new Map((departments || []).map(dep => [getDepartmentRowKey(dep), dep]));
		const jobs = ids.map(key => {
			const department = departmentMap.get(key);
			if (!department || !department.id) {
				return Promise.reject(new Error('Department not found'));
			}
			const payload = { ...department, status: targetStatus };
			return axios.put(`/api/departments/${department.id}`, payload);
		});
		const results = await Promise.allSettled(jobs);
		const successCount = results.filter(res => res.status === 'fulfilled').length;
		const failureCount = ids.length - successCount;
		if (successCount) {
			notifications.add(`Successfully ${verb} ${successCount} department${successCount === 1 ? '' : 's'}.`);
		}
		if (failureCount) {
			notifications.info(`Failed to ${verb} ${failureCount} department${failureCount === 1 ? '' : 's'}.`);
		}
		await loadDepartments();
	};

	const handleBulkAcademicYearStatus = async (ids, actionType) => {
		if (!ids?.length) return;
		const targetStatus = actionType === 'archive' ? 'Archived' : 'Active';
		const verb = actionType === 'archive' ? 'archived' : 'restored';
		const yearMap = new Map((academicYears || []).map(year => [getAcademicYearRowKey(year), year]));
		let successCount = 0;
		for (const key of ids) {
			const targetYear = yearMap.get(key);
			if (!targetYear) {
				continue;
			}
			await updateAcademicYearStatus(targetYear, targetStatus, { silent: true });
			successCount += 1;
		}
		if (successCount) {
			notifications.add(`Successfully ${verb} ${successCount} academic year${successCount === 1 ? '' : 's'}.`);
		}
		const failureCount = ids.length - successCount;
		if (failureCount) {
			notifications.info(`Failed to ${verb} ${failureCount} academic year${failureCount === 1 ? '' : 's'}.`);
		}
	};

	const openBulkAction = (subject, actionType, ids) => {
		if (!ids?.length) return;
		setBulkConfirm({ show: true, subject, action: actionType, ids });
		setBulkConfirmText('');
	};

	const performBulkAction = async () => {
		if (!bulkConfirm.show || !bulkConfirm.ids.length) return;
		setBulkConfirmInProgress(true);
		const { subject, action, ids } = bulkConfirm;
		try {
			if (subject === 'courses') {
				await handleBulkCourseStatus(ids, action);
				resetCourseSelection();
			} else if (subject === 'departments') {
				await handleBulkDepartmentStatus(ids, action);
				resetDepartmentSelection();
			} else if (subject === 'academic_years') {
				await handleBulkAcademicYearStatus(ids, action);
				resetYearSelection();
			}
			closeBulkConfirm();
		} catch (err) {
			console.error('Bulk action failed', err);
			notifications.info('Error: Failed to complete bulk action.');
		} finally {
			setBulkConfirmInProgress(false);
		}
	};

	const submitCourse = async (e) => {
		e.preventDefault();
		setSaving(true);
		try {
			const payload = {
				...courseForm,
				credits: courseForm.credits ? Number(courseForm.credits) : null,
				max_students: courseForm.max_students ? Number(courseForm.max_students) : null,
				department: courseForm.program
			};

			let response;
			if (editingItem && editingItem.id) {
				// Update existing course
				response = await axios.put(`/api/courses/${editingItem.id}`, payload);
				if (response.data.success) {
					await loadCourses();
					notifications.add(`Course "${payload.name}" has been updated successfully!`);
					closeModal();
				}
			} else {
				// Create new course
				response = await axios.post('/api/courses', payload);
				if (response.data.success) {
					await loadCourses();
					notifications.add(`Course "${payload.name}" has been created successfully!`);
					closeModal();
				}
			}
		} catch (err) {
			const errorMessage = err.response?.data?.message || 'Failed to save course';
			notifications.info(`Error: ${errorMessage}`);
		} finally {
			setSaving(false);
		}
	};

	const submitDepartment = async (e) => {
		e.preventDefault();
		setSaving(true);
		try {
			const payload = {
				...departmentForm,
				budget: departmentForm.budget ? Number(departmentForm.budget) : null
			};

			let response;
			if (editingItem && editingItem.id) {
				// Update existing department
				response = await axios.put(`/api/departments/${editingItem.id}`, payload);
				if (response.data.success) {
					await loadDepartments();
					notifications.add(`Department "${payload.name}" has been updated successfully!`);
					closeModal();
				}
			} else {
				// Create new department
				response = await axios.post('/api/departments', payload);
				if (response.data.success) {
					await loadDepartments();
					notifications.add(`Department "${payload.name}" has been created successfully!`);
					closeModal();
				}
			}
		} catch (err) {
			const errorMessage = err.response?.data?.message || 'Failed to save department';
			notifications.info(`Error: ${errorMessage}`);
		} finally {
			setSaving(false);
		}
	};

	const submitAcademicYear = async (e) => {
		e.preventDefault();
		setSaving(true);
		
		try {
			// Validate format YYYY-YYYY
			const raw = (academicYearForm.academic_year || '').trim();
			if (!/^\d{4}-\d{4}$/.test(raw)) {
				notifications.info('Error: Please enter a valid academic year (e.g., 2025-2026).');
				return;
			}
			const label = `SY ${raw}`;
			const targets = normalizeTargets(academicYearForm.targets || academicYearForm.target);
			const hasStudents = targets.includes('Students');
			const hasFaculty = targets.includes('Faculty');
			const statusPayload = academicYearForm.status;
			const ensureCustomYear = (key) => {
				try {
					const existing = JSON.parse(localStorage.getItem(key) || '[]');
					if (!existing.includes(label)) {
						localStorage.setItem(key, JSON.stringify([...existing, label]));
					}
				} catch (_) {}
			};

			if (editingItem && editingItem.id) {
				const previousTargets = [
					editingItem?.hasStudents ? 'Students' : null,
					editingItem?.hasFaculty ? 'Faculty' : null
				].filter(Boolean);

				setAcademicYears(prev => {
					const list = (prev || []).map(year => (
						year.id === editingItem.id
							? {
								...year,
								academic_year: academicYearForm.academic_year,
								status: statusPayload,
								hasStudents,
								hasFaculty
							}
							: year
					));
					return list.sort((a, b) => String(a.academic_year).localeCompare(String(b.academic_year)));
				});
				notifications.add(`Academic Year "${academicYearForm.academic_year}" has been updated!`);

				try {
					const mapKey = 'settings_academic_year_statuses';
					const map = JSON.parse(localStorage.getItem(mapKey) || '{}');
					map[academicYearForm.academic_year] = statusPayload;
					localStorage.setItem(mapKey, JSON.stringify(map));
					window.dispatchEvent(new CustomEvent('academicYearStatusUpdated', {
						detail: { year: academicYearForm.academic_year, status: statusPayload },
						bubbles: true
					}));
				} catch (_) {}

				const addedTargets = targets.filter(t => !previousTargets.includes(t));
				addedTargets.forEach(target => {
					try {
						window.dispatchEvent(new CustomEvent('academicYearAdded', {
							detail: { label, target },
							bubbles: true
						}));
					} catch (_) {}
					if (target === 'Faculty') {
						ensureCustomYear('facultyCustomYears');
					} else {
						ensureCustomYear('studentsCustomYears');
					}
				});
			} else {
				const nextId = academicYears.length ? Math.max(...academicYears.map(y => Number(y.id) || 0)) + 1 : 1;
				const newYear = {
					id: nextId,
					academic_year: academicYearForm.academic_year,
					status: statusPayload,
					hasStudents,
					hasFaculty
				};
				setAcademicYears(prev => {
					const list = Array.isArray(prev) ? [...prev, newYear] : [newYear];
					return list.sort((a, b) => String(a.academic_year).localeCompare(String(b.academic_year)));
				});
				notifications.add(`Academic Year "${newYear.academic_year}" has been added!`);

				try {
					const mapKey = 'settings_academic_year_statuses';
					const map = JSON.parse(localStorage.getItem(mapKey) || '{}');
					map[newYear.academic_year] = statusPayload;
					localStorage.setItem(mapKey, JSON.stringify(map));
					window.dispatchEvent(new CustomEvent('academicYearStatusUpdated', {
						detail: { year: newYear.academic_year, status: statusPayload },
						bubbles: true
					}));
				} catch (_) {}

				targets.forEach(target => {
					try {
						window.dispatchEvent(new CustomEvent('academicYearAdded', {
							detail: { label, target },
							bubbles: true
						}));
					} catch (_) {}
					if (target === 'Faculty') {
						ensureCustomYear('facultyCustomYears');
					} else {
						ensureCustomYear('studentsCustomYears');
					}
				});
			}
			closeModal();
		} catch (err) {
			notifications.info('Error: Failed to save academic year');
		} finally {
			setSaving(false);
		}
	};

	// Available programs from departments
	const availablePrograms = useMemo(() => {
		return departments.map(dept => dept.name).sort();
	}, [departments]);

	// Available faculty for instructor selection
	const availableFaculty = useMemo(() => {
		const academicPositions = [
			'Professor', 'Associate Professor', 'Assistant Professor',
			'Instructors', 'Supervising Instructors', 'Teachers',
			'Chairperson', 'Program Chair'
		];

		return faculty.filter(member => {
			const isAcademicDept = member.department === 'Academic / Teaching Positions';
			const isAcademicPosition = academicPositions.includes(member.program);
			const isActive = member.status === 'Active';
			
			return (isAcademicDept || isAcademicPosition) && isActive;
		}).map(member => ({
			id: member.id,
			name: `${member.first_name} ${member.last_name}`,
			position: member.program || member.department
		})).sort((a, b) => a.name.localeCompare(b.name));
	}, [faculty]);

	// Helpers for UI pills/badges and action buttons
	const renderStatusPill = (status) => {
		const s = String(status || '').toLowerCase();
		let bg;
		if (s === 'active') bg = '#16a34a';
		else if (s === 'inactive') bg = '#f59e0b';
		else if (s === 'completed') bg = '#0ea5e9';
		else if (s === 'archived') bg = '#6b7280';
		else bg = '#6b7280';
		return (
			<span
				className={`status-pill ${s}`}
				style={{ background: `${bg}22`, color: bg, border: `1px solid ${bg}44` }}
			>
				{status || '—'}
			</span>
		);
	};

	const handleEdit = (item, type) => {
		setEditingItem(item);
		setModalType(type);
		
		if (type === 'course') {
			setCourseForm({
				name: item.name || '',
				description: item.description || '',
				credits: item.credits || '',
				program: item.program || '',
				instructor: item.instructor || '',
				status: item.status || 'Active',
				max_students: item.max_students || ''
			});
		} else if (type === 'department') {
			setDepartmentForm({
				name: item.name || '',
				description: item.description || '',
				budget: item.budget || '',
				status: item.status || 'Active'
			});
		} else if (type === 'academic_year') {
			const targets = [];
			if (item?.hasStudents) targets.push('Students');
			if (item?.hasFaculty) targets.push('Faculty');
			if (!targets.length) targets.push('Students');
			setAcademicYearForm({
				academic_year: item.academic_year || '',
				status: item.status || 'Active',
				targets
			});
		}
		
		setShowModal(true);
	};

	const updateAcademicYearStatus = async (item, newStatus, options = {}) => {
		const { silent = false } = options || {};
		const action = String(newStatus).toLowerCase() === 'archived' ? 'archived' : 'restored';
		// Update local list
		setAcademicYears(prev => prev.map(year => year.id === item.id ? { ...year, status: newStatus } : year));
		// Persist status to map and notify
		try {
			const mapKey = 'settings_academic_year_statuses';
			const map = JSON.parse(localStorage.getItem(mapKey) || '{}');
			const cleanYear = String(item.academic_year).replace(/^SY\s*/, '');
			map[cleanYear] = newStatus;
			localStorage.setItem(mapKey, JSON.stringify(map));
			window.dispatchEvent(new CustomEvent('academicYearStatusUpdated', {
				detail: { year: cleanYear, status: newStatus },
				bubbles: true
			}));
		} catch (_) {}
		// Sync archives with Students/Faculty
		try {
			const label = `SY ${String(item.academic_year).replace(/^SY\s*/, '')}`;
			const sKey = 'studentsArchivedYears';
			const fKey = 'facultyArchivedYears';
			const sList = JSON.parse(localStorage.getItem(sKey) || '[]');
			const fList = JSON.parse(localStorage.getItem(fKey) || '[]');
			if (String(newStatus).toLowerCase() === 'archived') {
				if (!sList.includes(label)) localStorage.setItem(sKey, JSON.stringify([...sList, label]));
				if (!fList.includes(label)) localStorage.setItem(fKey, JSON.stringify([...fList, label]));
				window.dispatchEvent(new CustomEvent('academicYearArchived', { detail: { label }, bubbles: true }));
			} else {
				localStorage.setItem(sKey, JSON.stringify(sList.filter(y => y !== label)));
				localStorage.setItem(fKey, JSON.stringify(fList.filter(y => y !== label)));
				window.dispatchEvent(new CustomEvent('academicYearRestored', { detail: { label }, bubbles: true }));
			}
		} catch (_) {}
		if (!silent) {
			notifications.add(`Academic Year "${item.academic_year}" has been ${action} successfully!`);
		}
	};

	const handleArchive = async (item, type) => {
		const isCurrentlyArchived = String(item.status).toLowerCase() === 'archived';
		const newStatus = isCurrentlyArchived ? 'Active' : 'Archived';
		const action = isCurrentlyArchived ? 'restored' : 'archived';

		// Use typed confirmation for all types to match Students.js UX
		if (!isCurrentlyArchived) {
			setArchiveTarget({ item, type });
			setArchiveConfirmText("");
			setShowArchiveConfirm(true);
			return;
		} else {
			setRestoreTarget({ item, type });
			setRestoreConfirmText("");
			setShowRestoreConfirm(true);
			return;
		}
	};

	const confirmArchive = async () => {
		if (archiveConfirmText !== 'Archive' || !archiveTarget?.item || !archiveTarget?.type) return;
		setArchiveInProgress(true);
		const { item, type } = archiveTarget;
		try {
			if (type === 'academic_year') {
				await updateAcademicYearStatus(item, 'Archived');
			} else if (type === 'course') {
				const response = await axios.put(`/api/courses/${item.id}`, { ...item, status: 'Archived' });
				if (response.data.success) { await loadCourses(); notifications.add(`Course "${item.name}" has been archived successfully!`); }
			} else if (type === 'department') {
				const response = await axios.put(`/api/departments/${item.id}`, { ...item, status: 'Archived' });
				if (response.data.success) { await loadDepartments(); notifications.add(`Department "${item.name}" has been archived successfully!`); }
			}
		} catch (err) {
			const errorMessage = err.response?.data?.message || `Failed to archive ${type}`;
			notifications.info(`Error: ${errorMessage}`);
		} finally {
			setArchiveInProgress(false);
			setShowArchiveConfirm(false);
			setArchiveTarget({ item: null, type: '' });
			setArchiveConfirmText('');
		}
	};

	const confirmRestore = async () => {
		if (restoreConfirmText !== 'Restore' || !restoreTarget?.item || !restoreTarget?.type) return;
		setRestoreInProgress(true);
		const { item, type } = restoreTarget;
		try {
			if (type === 'academic_year') {
				await updateAcademicYearStatus(item, 'Active');
			} else if (type === 'course') {
				const response = await axios.put(`/api/courses/${item.id}`, { ...item, status: 'Active' });
				if (response.data.success) { await loadCourses(); notifications.add(`Course "${item.name}" has been restored successfully!`); }
			} else if (type === 'department') {
				const response = await axios.put(`/api/departments/${item.id}`, { ...item, status: 'Active' });
				if (response.data.success) { await loadDepartments(); notifications.add(`Department "${item.name}" has been restored successfully!`); }
			}
		} catch (err) {
			const errorMessage = err.response?.data?.message || `Failed to restore ${type}`;
			notifications.info(`Error: ${errorMessage}`);
		} finally {
			setRestoreInProgress(false);
			setShowRestoreConfirm(false);
			setRestoreTarget({ item: null, type: '' });
			setRestoreConfirmText('');
		}
	};

	const renderActionButtons = (item, type) => {
		const isArchived = String(item.status).toLowerCase() === 'archived';
		
		return (
			<div className="row-actions">
				<button 
					className="action-btn edit" 
					onClick={() => handleEdit(item, type)}
					title="Edit"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
						<path d="m15 5 4 4"/>
					</svg>
				</button>
				<button 
					className={`action-btn ${isArchived ? 'restore' : 'archive'}`} 
					onClick={() => handleArchive(item, type)}
					title={isArchived ? 'Restore' : 'Archive'}
				>
					{isArchived ? (
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
							<path d="M21 3v5h-5"/>
							<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
							<path d="M3 21v-5h5"/>
						</svg>
					) : (
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<rect width="20" height="5" x="2" y="3" rx="1"/>
							<path d="m4 8 16 0v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/>
							<path d="m10 12 4 0"/>
						</svg>
					)}
				</button>
				{type === 'academic_year' && (
					<button
						className="action-btn delete"
						onClick={() => handleDeleteYear(item)}
						title="Delete Academic Year"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M3 6h18"/>
							<path d="M8 6V4h8v2"/>
							<path d="M10 11v6"/>
							<path d="M14 11v6"/>
							<path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/>
						</svg>
					</button>
				)}
			</div>
		);
	};

	// Open delete confirm for Academic Year
	const handleDeleteYear = (item) => {
		if (!item) return;
		setDeleteTarget(item);
		setDeleteConfirmText("");
		setShowDeleteConfirm(true);
	};

	// Confirm deletion logic
	const confirmDeleteYear = async () => {
		if (deleteConfirmText !== 'Delete' || !deleteTarget) return;
		setDeleteInProgress(true);
		try {
			const yearStr = String(deleteTarget.academic_year).replace(/^SY\s*/i, '').trim();
			// Remove from academicYears state
			setAcademicYears(prev => prev.filter(y => String(y.academic_year) !== yearStr));
			// Clean status maps
			try {
				const STATUS_KEY = 'settings_academic_year_statuses';
				const PREV_STATUS_KEY = 'settings_academic_year_statuses_prev';
				let statusMap = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
				let prevMap = JSON.parse(localStorage.getItem(PREV_STATUS_KEY) || '{}');
				delete statusMap[yearStr];
				delete prevMap[yearStr];
				localStorage.setItem(STATUS_KEY, JSON.stringify(statusMap));
				localStorage.setItem(PREV_STATUS_KEY, JSON.stringify(prevMap));
			} catch (_) {}
			// Remove custom year labels from Students & Faculty custom arrays
			try {
				const label = `SY ${yearStr}`;
				['studentsCustomYears','facultyCustomYears','studentsArchivedYears','facultyArchivedYears'].forEach(key => {
					try {
						const list = JSON.parse(localStorage.getItem(key) || '[]');
						const next = list.filter(v => v !== label);
						localStorage.setItem(key, JSON.stringify(next));
					} catch (_) {}
				});
			} catch (_) {}
			// Dispatch deletion event so other pages can react (optional listeners)
			try {
				window.dispatchEvent(new CustomEvent('academicYearDeleted', { detail: { year: yearStr } }));
			} catch (_) {}
			notifications.add(`Academic Year "${yearStr}" has been deleted.`);
		} catch (err) {
			notifications.info('Error: Failed to delete academic year.');
		} finally {
			setDeleteInProgress(false);
			setShowDeleteConfirm(false);
			setDeleteTarget(null);
			setDeleteConfirmText('');
		}
	};

	const totalCourses = courses.length;
	const totalDepartments = departments.length;
	const totalAcademicYears = academicYears.length;
	const activeCourses = courses.filter(c => String(c?.status).toLowerCase() === 'active').length;

	return (
		<div className="settings-root">{/* use new settings styles */}
			{/* Banner */}
			<div className="settings-banner" style={{ marginBottom: 16 }}>
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
							src="/images/Settings_Manager.png"
							alt="Settings icon"
							style={{ width: '60%', height: '60%', objectFit: 'cover' }}
						/>
					</div>
					<div className="settings-banner-content">
						<div className="settings-banner-title">Academic Management</div>
						<div className="settings-banner-sub">FSUU - Manage courses, departments, and academic years</div>
					</div>
				</div>
			</div>

			{/* Stat cards */}

	{/* Delete confirm (typed) Academic Year */}
	{showDeleteConfirm && (
		<div
			className="students-modal-bg"
			style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500 }}
			onClick={() => !deleteInProgress && setShowDeleteConfirm(false)}
		>
			<div
				className="students-modal"
				onClick={(e) => e.stopPropagation()}
				style={{ background: '#fff', width: '100%', maxWidth: 440, padding: '32px 36px', borderRadius: 22, boxShadow: '0 8px 28px rgba(0,0,0,.18)' }}
			>
				<h3 style={{ marginTop: 0, marginBottom: 6 }}>Delete Academic Year</h3>
				<div style={{ fontSize: 14, lineHeight: 1.5, color: '#374151', marginBottom: 18 }}>
					<b>{deleteTarget?.academic_year}</b>
					<br /><br />
					This will permanently remove this academic year, its archived status, and any custom folders referencing it. Other records that may reference this label will not be altered.
					<br /><br />
					Type <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>Delete</code> to confirm.
				</div>
				<input
					autoFocus
					type="text"
					placeholder='Type "Delete" to confirm'
					value={deleteConfirmText}
					onChange={(e) => setDeleteConfirmText(e.target.value)}
					style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14 }}
					disabled={deleteInProgress}
				/>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
					<button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleteInProgress} style={{ background: '#e5e7eb', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 600 }}>
						Cancel
					</button>
					<button
						type="button"
						onClick={confirmDeleteYear}
						disabled={deleteConfirmText !== 'Delete' || deleteInProgress}
						style={{
							background: deleteConfirmText === 'Delete' && !deleteInProgress ? '#dc2626' : '#fca5a5',
							color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 600,
							cursor: deleteConfirmText === 'Delete' && !deleteInProgress ? 'pointer' : 'not-allowed'
						}}
					>
						{deleteInProgress ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</div>
	)}

	{/* Archive confirm (typed) for AY/Course/Department */}
	{showArchiveConfirm && (
		<div
			className="students-modal-bg"
			style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500 }}
			onClick={() => !archiveInProgress && setShowArchiveConfirm(false)}
		>
			<div
				className="students-modal"
				onClick={(e) => e.stopPropagation()}
				style={{ background: '#fff', width: '100%', maxWidth: 440, padding: '32px 36px', borderRadius: 22, boxShadow: '0 8px 28px rgba(0,0,0,.18)' }}
			>
				<h3 style={{ marginTop: 0, marginBottom: 6 }}>Archive {archiveTarget?.type === 'course' ? 'Course' : archiveTarget?.type === 'department' ? 'Department' : 'Academic Year'}</h3>
				<div style={{ fontSize: 14, lineHeight: 1.5, color: '#374151', marginBottom: 18 }}>
					<b>{archiveTarget?.type === 'academic_year' ? archiveTarget?.item?.academic_year : archiveTarget?.item?.name}</b>
					<br /><br />
					Type <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>Archive</code> to confirm.
				</div>
				<input
					autoFocus
					type="text"
					placeholder='Type "Archive" to confirm'
					value={archiveConfirmText}
					onChange={(e) => setArchiveConfirmText(e.target.value)}
					style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14 }}
					disabled={archiveInProgress}
				/>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
					<button type="button" onClick={() => setShowArchiveConfirm(false)} disabled={archiveInProgress} style={{ background: '#e5e7eb', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 600 }}>
						Cancel
					</button>
					<button
						type="button"
						onClick={confirmArchive}
						disabled={archiveConfirmText !== 'Archive' || archiveInProgress}
						style={{
							background: archiveConfirmText === 'Archive' && !archiveInProgress ? '#dc2626' : '#fca5a5',
							color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 600,
							cursor: archiveConfirmText === 'Archive' && !archiveInProgress ? 'pointer' : 'not-allowed'
						}}
					>
						{archiveInProgress ? 'Archiving...' : 'Archive'}
					</button>
				</div>
			</div>
		</div>
	)}

	{/* Restore confirm (typed) for AY/Course/Department */}
	{showRestoreConfirm && (
		<div
			className="students-modal-bg"
			style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500 }}
			onClick={() => !restoreInProgress && setShowRestoreConfirm(false)}
		>
			<div
				className="students-modal"
				onClick={(e) => e.stopPropagation()}
				style={{ background: '#fff', width: '100%', maxWidth: 440, padding: '32px 36px', borderRadius: 22, boxShadow: '0 8px 28px rgba(0,0,0,.18)' }}
			>
				<h3 style={{ marginTop: 0, marginBottom: 6 }}>Restore {restoreTarget?.type === 'course' ? 'Course' : restoreTarget?.type === 'department' ? 'Department' : 'Academic Year'}</h3>
				<div style={{ fontSize: 14, lineHeight: 1.5, color: '#374151', marginBottom: 18 }}>
					<b>{restoreTarget?.type === 'academic_year' ? restoreTarget?.item?.academic_year : restoreTarget?.item?.name}</b>
					<br /><br />
					Type <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>Restore</code> to confirm.
				</div>
				<input
					autoFocus
					type="text"
					placeholder='Type "Restore" to confirm'
					value={restoreConfirmText}
					onChange={(e) => setRestoreConfirmText(e.target.value)}
					style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14 }}
					disabled={restoreInProgress}
				/>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
					<button type="button" onClick={() => setShowRestoreConfirm(false)} disabled={restoreInProgress} style={{ background: '#e5e7eb', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 600 }}>
						Cancel
					</button>
					<button
						type="button"
						onClick={confirmRestore}
						disabled={restoreConfirmText !== 'Restore' || restoreInProgress}
						style={{
							background: restoreConfirmText === 'Restore' && !restoreInProgress ? '#16a34a' : '#bbf7d0',
							color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 600,
							cursor: restoreConfirmText === 'Restore' && !restoreInProgress ? 'pointer' : 'not-allowed'
						}}
					>
						{restoreInProgress ? 'Restoring...' : 'Restore'}
					</button>
				</div>
			</div>
		</div>
	)}

	{bulkConfirm.show && (
		<div
			className="students-modal-bg"
			style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500 }}
			onClick={() => !bulkConfirmInProgress && closeBulkConfirm()}
		>
			<div
				className="students-modal"
				onClick={(e) => e.stopPropagation()}
				style={{ background: '#fff', width: '100%', maxWidth: 460, padding: '32px 36px', borderRadius: 22, boxShadow: '0 8px 28px rgba(0,0,0,.18)' }}
			>
				{(() => {
					const actionLabel = bulkConfirm.action === 'restore' ? 'Restore' : 'Archive';
					const subjectLabel = bulkConfirm.subject === 'courses' ? 'Courses' : bulkConfirm.subject === 'departments' ? 'Departments' : 'Academic Years';
					const count = bulkConfirm.ids?.length || 0;
					return (
						<>
							<h3 style={{ marginTop: 0, marginBottom: 6 }}>
								{actionLabel} {count} {subjectLabel}
							</h3>
							<div style={{ fontSize: 14, lineHeight: 1.5, color: '#374151', marginBottom: 18 }}>
								You are about to {actionLabel.toLowerCase()} <b>{count}</b> {subjectLabel.toLowerCase()}.
								<br /><br />
								Type <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>{actionLabel}</code> to confirm.
							</div>
						</>
					);
				})()}
				<input
					autoFocus
					type="text"
					placeholder={`Type "${bulkConfirm.action === 'restore' ? 'Restore' : 'Archive'}" to confirm`}
					value={bulkConfirmText}
					onChange={(e) => setBulkConfirmText(e.target.value)}
					style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14 }}
					disabled={bulkConfirmInProgress}
				/>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
					<button
						type="button"
						onClick={() => !bulkConfirmInProgress && closeBulkConfirm()}
						disabled={bulkConfirmInProgress}
						style={{ background: '#e5e7eb', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 600 }}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={performBulkAction}
						disabled={bulkConfirmText !== (bulkConfirm.action === 'restore' ? 'Restore' : 'Archive') || bulkConfirmInProgress}
						style={{
							background: bulkConfirmText === (bulkConfirm.action === 'restore' ? 'Restore' : 'Archive') && !bulkConfirmInProgress
								? (bulkConfirm.action === 'restore' ? '#16a34a' : '#dc2626')
								: (bulkConfirm.action === 'restore' ? '#bbf7d0' : '#fca5a5'),
							color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 600,
							cursor: bulkConfirmText === (bulkConfirm.action === 'restore' ? 'Restore' : 'Archive') && !bulkConfirmInProgress ? 'pointer' : 'not-allowed'
						}}
					>
						{bulkConfirmInProgress ? (bulkConfirm.action === 'restore' ? 'Restoring...' : 'Archiving...') : (bulkConfirm.action === 'restore' ? 'Restore' : 'Archive')}
					</button>
				</div>
			</div>
		</div>
	)}
			<div className="settings-stats-row" style={{ marginTop: 8 }}>
				<div className="settings-stat-card bg-sky">
					<div className="settings-stat-value">{totalCourses.toLocaleString()}</div>
					<div className="settings-stat-label">Total Courses</div>
					<div className="settings-stat-sub">Across all departments</div>
				</div>
				<div className="settings-stat-card bg-mint">
					<div className="settings-stat-value">{totalDepartments.toLocaleString()}</div>
					<div className="settings-stat-label">Departments</div>
					<div className="settings-stat-sub">Active units</div>
				</div>
				<div className="settings-stat-card bg-sun">
					<div className="settings-stat-value">{activeCourses.toLocaleString()}</div>
					<div className="settings-stat-label">Active Courses</div>
					<div className="settings-stat-sub">Currently offered</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="settings-controls" style={{ marginTop: 8 }}>
				<div className="settings-tabs">
					<button
						className={`settings-tab ${activeTab === 'Courses' ? 'active' : ''}`}
						onClick={() => setActiveTab('Courses')}
					>
						Courses
					</button>
					<button
						className={`settings-tab ${activeTab === 'Departments' ? 'active' : ''}`}
						onClick={() => setActiveTab('Departments')}
					>
						Departments
					</button>
					<button
						className={`settings-tab ${activeTab === 'Academic Years' ? 'active' : ''}`}
						onClick={() => setActiveTab('Academic Years')}
					>
						Academic Years
					</button>
				</div>
			</div>

			{/* Courses Tab */}
			{activeTab === 'Courses' && (
				<div className="settings-main-section">
					<div className="settings-section-header">
						<div>
							<h2 className="settings-section-title">Course Management</h2>
							<p className="settings-section-subtitle">Manage courses across all departments</p>
						</div>
						<button className="export-btn" onClick={() => openAddModal('course')} title="Add Course">
							Add Course
						</button>
					</div>

					{/* Filters row */}
					<div className="settings-ui-filters" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
						{/* Department select */}
						<div className="filter-type">
							<select
								id="courses-department-select"
								className="reports-select"
								value={selectedDepartment}
								onChange={e => setSelectedDepartment(e.target.value)}
								aria-label="Department"
							>
								<option value="All Departments">All Departments</option>
								{departmentOptions.map((d) => (
									<option key={d} value={d}>{d}</option>
								))}
							</select>
						</div>

						{/* Status select */}
						<div className="filter-type">
							<select
								id="courses-status-select"
								className="reports-select"
								value={selectedStatus}
								onChange={e => setSelectedStatus(e.target.value)}
								aria-label="Status"
							>
								<option value="All Statuses">All Statuses</option>
								{statusOptions.map(s => (
									<option key={s} value={s}>{s}</option>
								))}
							</select>
						</div>

						{/* Search */}
						<div className="search-container">
							<span className="search-icon" aria-hidden>
								<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
									<circle cx="11" cy="11" r="8"/>
									<path d="M21 21l-4.35-4.35"/>
								</svg>
							</span>
							<input
								className="reports-search-input"
								placeholder={'Search courses by name or department…'}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								type="text"
							/>
							{searchTerm && (
								<button
									type="button"
									className="clear-btn"
									onClick={() => setSearchTerm('')}
									aria-label="Clear search"
								>
									×
								</button>
							)}
						</div>

						{/* Archive toggle buttons */}
						<div className="archive-toggle-container">
							<button 
								className={`archive-toggle-btn ${!showArchived ? 'active' : ''}`}
								onClick={() => setShowArchived(false)}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<circle cx="12" cy="12" r="10"/>
									<polyline points="12,6 12,12 16,14"/>
								</svg>
								Active
							</button>
							<button 
								className={`archive-toggle-btn ${showArchived ? 'active' : ''}`}
								onClick={() => setShowArchived(true)}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<rect width="20" height="5" x="2" y="3" rx="1"/>
									<path d="m4 8 16 0v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/>
									<path d="m10 12 4 0"/>
								</svg>
								Archived
							</button>
						</div>

						<div className="filter-info">
							<span className="filter-badge">{selectedDepartment}</span>
							<span className="filter-badge">{selectedStatus}</span>
							<span className="count-text">{filteredCourses.length} courses found</span>
						</div>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px', gap: 12, flexWrap: 'wrap' }}>
						{!courseSelectionMode ? (
							<button
								type="button"
								style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 14px', borderRadius: 10, fontWeight: 700 }}
								onClick={() => {
									setCourseSelectionMode(true);
									setSelectedCourseIds(new Set());
								}}
								disabled={!filteredCourses.length}
							>
								Select
							</button>
						) : (
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
								<label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
									<input
										type="checkbox"
										checked={allCoursesSelected}
										onChange={e => {
											if (e.target.checked) {
												setSelectedCourseIds(new Set(displayedCourseKeys));
											} else {
												setSelectedCourseIds(new Set());
											}
										}}
									/>
									Select all ({filteredCourses.length})
								</label>
								<button
									type="button"
									onClick={resetCourseSelection}
									style={{ background: '#e5e7eb', border: 'none', padding: '6px 14px', borderRadius: 10, fontWeight: 700 }}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => openBulkAction('courses', showArchived ? 'restore' : 'archive', Array.from(selectedCourseIds))}
									disabled={!selectedCoursesCount}
									style={{
										background: selectedCoursesCount ? (showArchived ? '#16a34a' : '#dc2626') : '#e5e7eb',
										color: selectedCoursesCount ? '#fff' : '#6b7280',
										border: 'none',
										padding: '6px 18px',
										borderRadius: 10,
										fontWeight: 700,
										cursor: selectedCoursesCount ? 'pointer' : 'not-allowed'
									}}
								>
									{showArchived ? `Restore Selected (${selectedCoursesCount})` : `Archive Selected (${selectedCoursesCount})`}
								</button>
							</div>
						)}
					</div>

					{/* Table */}
					<div className="settings-ui-table-wrap">
						{error && <div className="settings-ui-error">{error}</div>}
						<table className="settings-ui-table">
							<thead>
								<tr>
									{courseSelectionMode && <th style={{ width: 42 }}></th>}
									<th>ID</th>
									<th>Course Name</th>
									<th>Department</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={courseSelectionMode ? 6 : 5} className="loading-cell">Loading...</td></tr>
								) : filteredCourses.length ? (
									(() => {
										// Group courses by department/program
										const groups = filteredCourses.reduce((acc, c) => {
											const key = (c?.program || '—').toString();
											if (!acc[key]) acc[key] = [];
											acc[key].push(c);
											return acc;
										}, {});

										const deptNames = Object.keys(groups).sort((a, b) => a.localeCompare(b));
										const rows = [];
										deptNames.forEach((dept) => {
											// Section header for department
											rows.push(
												<tr key={`dept-${dept}`} className="group-header-row">
													<td colSpan={courseSelectionMode ? 6 : 5} style={{
														background: '#f8fafc',
														color: '#111827',
														fontWeight: 700,
														padding: '10px 12px',
														borderTop: '1px solid #e5e7eb',
														borderBottom: '1px solid #e5e7eb'
													}}>
													{dept}
												</td>
											</tr>
											);
											// Rows for courses under this department
											groups[dept]
												.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
												.forEach((course) => {
													const key = getCourseRowKey(course);
													rows.push(
														<tr key={course.id ?? `course-${dept}-${course.name}`}>
															{courseSelectionMode && (
																<td style={{ width: 42 }}>
																	<input
																		type="checkbox"
																		checked={selectedCourseIds.has(key)}
																		onChange={() => {
																			setSelectedCourseIds(prev => {
																				const next = new Set(prev);
																				if (next.has(key)) {
																					next.delete(key);
																				} else {
																					next.add(key);
																				}
																				return next;
																			});
																		}}
																	/>
																</td>
															)}
															<td><strong>{course?.id ?? '—'}</strong></td>
															<td style={{ fontWeight: 600 }}>{course?.name || '—'}</td>
															<td><span style={{ color: '#2563eb', fontWeight: 600 }}>{course?.program || '—'}</span></td>
															<td>{renderStatusPill(course?.status)}</td>
															<td>{renderActionButtons(course, 'course')}</td>
														</tr>
													);
												});
										});
										return rows;
									})()
								) : (
									<tr><td colSpan={courseSelectionMode ? 6 : 5} className="empty-row">No courses match your filters</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Departments Tab */}
			{activeTab === 'Departments' && (
				<div className="settings-main-section">
					<div className="settings-section-header">
						<div>
							<h2 className="settings-section-title">Department Management</h2>
							<p className="settings-section-subtitle">Manage university departments and units</p>
						</div>
						<button className="export-btn" onClick={() => openAddModal('department')} title="Add Department">
							Add Department
						</button>
					</div>

					{/* Filters row */}
					<div className="settings-ui-filters" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
						{/* Status select */}
						<div className="filter-type">
							<select
								id="departments-status-select"
								className="reports-select"
								value={selectedStatus}
								onChange={e => setSelectedStatus(e.target.value)}
								aria-label="Status"
							>
								<option value="All Statuses">All Statuses</option>
								{statusOptions.map(s => (
									<option key={s} value={s}>{s}</option>
								))}
							</select>
						</div>

						{/* Search */}
						<div className="search-container">
							<span className="search-icon" aria-hidden>
								<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
									<circle cx="11" cy="11" r="8"/>
									<path d="M21 21l-4.35-4.35"/>
								</svg>
							</span>
							<input
								className="reports-search-input"
								placeholder={'Search departments by name…'}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								type="text"
							/>
							{searchTerm && (
								<button
									type="button"
									className="clear-btn"
									onClick={() => setSearchTerm('')}
									aria-label="Clear search"
								>
									×
								</button>
							)}
						</div>

						{/* Archive toggle buttons */}
						<div className="archive-toggle-container">
							<button 
								className={`archive-toggle-btn ${!showArchived ? 'active' : ''}`}
								onClick={() => setShowArchived(false)}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<circle cx="12" cy="12" r="10"/>
									<polyline points="12,6 12,12 16,14"/>
								</svg>
								Active
							</button>
							<button 
								className={`archive-toggle-btn ${showArchived ? 'active' : ''}`}
								onClick={() => setShowArchived(true)}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<rect width="20" height="5" x="2" y="3" rx="1"/>
									<path d="m4 8 16 0v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/>
									<path d="m10 12 4 0"/>
								</svg>
								Archived
							</button>
						</div>

						<div className="filter-info">
							<span className="filter-badge">{selectedStatus}</span>
							<span className="count-text">{filteredDepartments.length} departments found</span>
						</div>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px', gap: 12, flexWrap: 'wrap' }}>
						{!departmentSelectionMode ? (
							<button
								type="button"
								style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 14px', borderRadius: 10, fontWeight: 700 }}
								onClick={() => {
									setDepartmentSelectionMode(true);
									setSelectedDepartmentIds(new Set());
								}}
								disabled={!filteredDepartments.length}
							>
								Select
							</button>
						) : (
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
								<label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
									<input
										type="checkbox"
										checked={allDepartmentsSelected}
										onChange={e => {
											if (e.target.checked) {
												setSelectedDepartmentIds(new Set(displayedDepartmentKeys));
											} else {
												setSelectedDepartmentIds(new Set());
											}
										}}
									/>
									Select all ({filteredDepartments.length})
								</label>
								<button
									type="button"
									onClick={resetDepartmentSelection}
									style={{ background: '#e5e7eb', border: 'none', padding: '6px 14px', borderRadius: 10, fontWeight: 700 }}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => openBulkAction('departments', showArchived ? 'restore' : 'archive', Array.from(selectedDepartmentIds))}
									disabled={!selectedDepartmentsCount}
									style={{
										background: selectedDepartmentsCount ? (showArchived ? '#16a34a' : '#dc2626') : '#e5e7eb',
										color: selectedDepartmentsCount ? '#fff' : '#6b7280',
										border: 'none',
										padding: '6px 18px',
										borderRadius: 10,
										fontWeight: 700,
										cursor: selectedDepartmentsCount ? 'pointer' : 'not-allowed'
									}}
								>
									{showArchived ? `Restore Selected (${selectedDepartmentsCount})` : `Archive Selected (${selectedDepartmentsCount})`}
								</button>
							</div>
						)}
					</div>

					{/* Table */}
					<div className="settings-ui-table-wrap">
						{error && <div className="settings-ui-error">{error}</div>}
						<table className="settings-ui-table">
							<thead>
								<tr>
									{departmentSelectionMode && <th style={{ width: 42 }}></th>}
									<th>ID</th>
									<th>Department Name</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={departmentSelectionMode ? 5 : 4} className="loading-cell">Loading...</td></tr>
								) : filteredDepartments.length ? (
									filteredDepartments.map((department) => {
										const rowKey = getDepartmentRowKey(department);
										return (
											<tr key={department.id ?? `dept-${department.name}`}>
												{departmentSelectionMode && (
													<td style={{ width: 42 }}>
														<input
															type="checkbox"
															checked={selectedDepartmentIds.has(rowKey)}
															onChange={() => {
																setSelectedDepartmentIds(prev => {
																	const next = new Set(prev);
																	if (next.has(rowKey)) {
																		next.delete(rowKey);
																	} else {
																		next.add(rowKey);
																	}
																	return next;
																});
															}}
														/>
													</td>
												)}
												<td><strong>{department?.id ?? '—'}</strong></td>
												<td style={{ fontWeight: 600 }}>{department?.name || '—'}</td>
												<td>{renderStatusPill(department?.status)}</td>
												<td>{renderActionButtons(department, 'department')}</td>
											</tr>
										);
									})
								) : (
									<tr><td colSpan={departmentSelectionMode ? 5 : 4} className="empty-row">No departments match your filters</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Academic Years Tab */}
			{activeTab === 'Academic Years' && (
				<div className="settings-main-section">
					<div className="settings-section-header">
						<div>
							<h2 className="settings-section-title">Academic Years Management</h2>
							<p className="settings-section-subtitle">Manage academic year periods and terms</p>
						</div>
						<button className="export-btn" onClick={() => openAddModal('academic_year')} title="Add Academic Year">
							Add Academic Year
						</button>
					</div>

					{/* Filters row */}
					<div className="settings-ui-filters" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
						{/* Source select (Students/Faculty/All) */}
						<div className="filter-type">
							<select
								id="academic-years-source-select"
								className="reports-select"
								value={selectedSource}
								onChange={e => setSelectedSource(e.target.value)}
								aria-label="Source"
							>
								<option value="All">All</option>
								<option value="Students">Students</option>
								<option value="Faculty">Faculty</option>
							</select>
						</div>
						{/* Status select */}
						<div className="filter-type">
							<select
								id="academic-years-status-select"
								className="reports-select"
								value={selectedStatus}
								onChange={e => setSelectedStatus(e.target.value)}
								aria-label="Status"
							>
								<option value="All Statuses">All Statuses</option>
								{statusOptions.map(s => (
									<option key={s} value={s}>{s}</option>
								))}
							</select>
						</div>

						{/* Search */}
						<div className="search-container">
							<span className="search-icon" aria-hidden>
								<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
									<circle cx="11" cy="11" r="8"/>
									<path d="M21 21l-4.35-4.35"/>
								</svg>
							</span>
							<input
								className="reports-search-input"
								placeholder={'Search academic years…'}
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								type="text"
							/>
							{searchTerm && (
								<button
									type="button"
									className="clear-btn"
									onClick={() => setSearchTerm('')}
									aria-label="Clear search"
								>
									×
								</button>
							)}
						</div>

						{/* Archive toggle buttons */}
						<div className="archive-toggle-container">
							<button 
								className={`archive-toggle-btn ${!showArchived ? 'active' : ''}`}
								onClick={() => setShowArchived(false)}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<circle cx="12" cy="12" r="10"/>
									<polyline points="12,6 12,12 16,14"/>
								</svg>
								Active
							</button>
							<button 
								className={`archive-toggle-btn ${showArchived ? 'active' : ''}`}
								onClick={() => setShowArchived(true)}
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<rect width="20" height="5" x="2" y="3" rx="1"/>
									<path d="m4 8 16 0v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/>
									<path d="m10 12 4 0"/>
								</svg>
								Archived
							</button>
						</div>

						<div className="filter-info">
							<span className="filter-badge">{selectedSource}</span>
							<span className="filter-badge">{selectedStatus}</span>
							<span className="count-text">{filteredAcademicYears.length} academic years found</span>
						</div>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px', gap: 12, flexWrap: 'wrap' }}>
						{!yearSelectionMode ? (
							<button
								type="button"
								style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 14px', borderRadius: 10, fontWeight: 700 }}
								onClick={() => {
									setYearSelectionMode(true);
									setSelectedYearIds(new Set());
								}}
								disabled={!filteredAcademicYears.length}
							>
								Select
							</button>
						) : (
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
								<label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
									<input
										type="checkbox"
										checked={allYearsSelected}
										onChange={e => {
											if (e.target.checked) {
												setSelectedYearIds(new Set(displayedYearKeys));
											} else {
												setSelectedYearIds(new Set());
											}
										}}
									/>
									Select all ({filteredAcademicYears.length})
								</label>
								<button
									type="button"
									onClick={resetYearSelection}
									style={{ background: '#e5e7eb', border: 'none', padding: '6px 14px', borderRadius: 10, fontWeight: 700 }}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => openBulkAction('academic_years', showArchived ? 'restore' : 'archive', Array.from(selectedYearIds))}
									disabled={!selectedYearsCount}
									style={{
										background: selectedYearsCount ? (showArchived ? '#16a34a' : '#dc2626') : '#e5e7eb',
										color: selectedYearsCount ? '#fff' : '#6b7280',
										border: 'none',
										padding: '6px 18px',
										borderRadius: 10,
										fontWeight: 700,
										cursor: selectedYearsCount ? 'pointer' : 'not-allowed'
									}}
								>
									{showArchived ? `Restore Selected (${selectedYearsCount})` : `Archive Selected (${selectedYearsCount})`}
								</button>
							</div>
						)}
					</div>

					{/* Table */}
					<div className="settings-ui-table-wrap">
						{error && <div className="settings-ui-error">{error}</div>}
						<table className="settings-ui-table">
							<thead>
								<tr>
									{yearSelectionMode && <th style={{ width: 42 }}></th>}
									<th>ID</th>
									<th>Academic Year</th>
									<th>Source</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={yearSelectionMode ? 6 : 5} className="loading-cell">Loading...</td></tr>
								) : filteredAcademicYears.length ? (
									filteredAcademicYears.map((year) => {
										const rowKey = getAcademicYearRowKey(year);
										return (
											<tr key={year.id ?? `year-${year.academic_year}`}>
												{yearSelectionMode && (
													<td style={{ width: 42 }}>
														<input
															type="checkbox"
															checked={selectedYearIds.has(rowKey)}
															onChange={() => {
																setSelectedYearIds(prev => {
																	const next = new Set(prev);
																	if (next.has(rowKey)) {
																		next.delete(rowKey);
																	} else {
																		next.add(rowKey);
																	}
																	return next;
																});
															}}
														/>
													</td>
												)}
												<td><strong>{year?.id ?? '—'}</strong></td>
												<td style={{ fontWeight: 600 }}>{year?.academic_year || '—'}</td>
												<td>
												{year?.hasStudents && (
													<span style={{
														display: 'inline-block',
														background: '#e0f2fe',
														color: '#0369a1',
														border: '1px solid #bae6fd',
														borderRadius: 10,
														padding: '2px 8px',
														fontSize: 12,
														fontWeight: 700,
														marginRight: 6
													}}>Students</span>
												)}
												{year?.hasFaculty && (
													<span style={{
														display: 'inline-block',
														background: '#fef9c3',
														color: '#854d0e',
														border: '1px solid #fde68a',
														borderRadius: 10,
														padding: '2px 8px',
														fontSize: 12,
														fontWeight: 700
													}}>Faculty</span>
												)}
											</td>
											<td>{renderStatusPill(year?.status)}</td>
											<td>{renderActionButtons(year, 'academic_year')}</td>
										</tr>
										);
									})
								) : (
									<tr><td colSpan={yearSelectionMode ? 6 : 5} className="empty-row">No academic years match your filters</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Modals */}
			{showModal && modalType === 'course' && (
				<div className="settings-ui-modal-bg" onClick={() => !saving && closeModal()}>
					<div className="settings-ui-modal" onClick={e => e.stopPropagation()}>
						<div className="modal-head">
							<h3>{editingItem ? 'Edit Course' : 'Add New Course'}</h3>
							<button className="close-btn" onClick={() => !saving && closeModal()}>×</button>
						</div>
						<form onSubmit={submitCourse} className="modal-form-grid">
							<div className="form-group">
								<label>Course Name *</label>
								<input 
									name="name" 
									value={courseForm.name} 
									onChange={handleCourseFormChange} 
									required 
								/>
							</div>
							<div className="form-group">
								<label>Program *</label>
								<select 
									name="program" 
									value={courseForm.program} 
									onChange={handleCourseFormChange} 
									required
								>
									<option value="">Select Program</option>
									{availablePrograms.map(program => (
										<option key={program} value={program}>{program}</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Instructor</label>
								<select 
									name="instructor" 
									value={courseForm.instructor} 
									onChange={handleCourseFormChange}
								>
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
								<input 
									name="credits" 
									type="number" 
									min="1" 
									max="10" 
									value={courseForm.credits} 
									onChange={handleCourseFormChange} 
									required 
								/>
							</div>
							<div className="form-group">
								<label>Max Students</label>
								<input 
									name="max_students" 
									type="number" 
									min="1" 
									value={courseForm.max_students} 
									onChange={handleCourseFormChange} 
								/>
							</div>
							<div className="form-group">
								<label>Status *</label>
								<select 
									name="status" 
									value={courseForm.status} 
									onChange={handleCourseFormChange}
								>
									<option value="Active">Active</option>
									<option value="Inactive">Inactive</option>
								</select>
							</div>
							<div className="form-group full">
								<label>Description</label>
								<textarea 
									name="description" 
									rows="3" 
									value={courseForm.description} 
									onChange={handleCourseFormChange} 
								/>
							</div>
							<div className="modal-actions full">
								<button 
									type="button" 
									className="btn secondary" 
									disabled={saving}
									onClick={() => !saving && closeModal()}
								>
									Cancel
								</button>
								<button 
									type="submit" 
									className="btn primary" 
									disabled={saving}
								>
									{saving ? (editingItem ? 'Updating...' : 'Creating...') : (editingItem ? 'Update Course' : 'Add Course')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showModal && modalType === 'department' && (
				<div className="settings-ui-modal-bg" onClick={() => !saving && closeModal()}>
					<div className="settings-ui-modal" onClick={e => e.stopPropagation()}>
						<div className="modal-head">
							<h3>{editingItem ? 'Edit Department' : 'Add New Department'}</h3>
							<button className="close-btn" onClick={() => !saving && closeModal()}>×</button>
						</div>
						<form onSubmit={submitDepartment} className="modal-form-grid">
							<div className="form-group">
								<label>Department Name *</label>
								<input 
									name="name" 
									value={departmentForm.name} 
									onChange={handleDepartmentFormChange} 
									required 
								/>
							</div>
							<div className="form-group">
								<label>Budget</label>
								<input 
									name="budget" 
									type="number" 
									min="0" 
									value={departmentForm.budget} 
									onChange={handleDepartmentFormChange} 
								/>
							</div>
							<div className="form-group full">
								<label>Description</label>
								<textarea 
									name="description" 
									rows="3" 
									value={departmentForm.description} 
									onChange={handleDepartmentFormChange} 
								/>
							</div>
							<div className="form-group">
								<label>Status *</label>
								<select 
									name="status" 
									value={departmentForm.status} 
									onChange={handleDepartmentFormChange}
								>
									<option value="Active">Active</option>
									<option value="Inactive">Inactive</option>
								</select>
							</div>
							<div className="modal-actions full">
								<button 
									type="button" 
									className="btn secondary" 
									disabled={saving}
									onClick={() => !saving && closeModal()}
								>
									Cancel
								</button>
								<button 
									type="submit" 
									className="btn primary" 
									disabled={saving}
								>
									{saving ? (editingItem ? 'Updating...' : 'Creating...') : (editingItem ? 'Update Department' : 'Add Department')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showModal && modalType === 'academic_year' && (
				<div className="settings-ui-modal-bg" onClick={() => !saving && closeModal()}>
					<div className="settings-ui-modal" onClick={e => e.stopPropagation()}>
						<div className="modal-head">
							<h3>{editingItem ? 'Edit Academic Year' : 'Add New Academic Year'}</h3>
							<button className="close-btn" onClick={() => !saving && closeModal()}>×</button>
						</div>
						<form onSubmit={submitAcademicYear} className="modal-form-grid">
							<div className="form-group">
								<label>Academic Year *</label>
								<input 
									name="academic_year" 
									value={academicYearForm.academic_year} 
									onChange={handleAcademicYearFormChange} 
									placeholder="e.g., 2024-2025"
									required 
								/>
							</div>
							<div className="form-group">
								<label>Targets *</label>
								<div className="checkbox-group" style={{ display: 'flex', gap: 12 }}>
									{['Students', 'Faculty'].map(option => (
										<label key={option} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
											<input
												type="checkbox"
												checked={(academicYearForm.targets || []).includes(option)}
												onChange={() => toggleAcademicYearTarget(option)}
											/>
											<span>{option}</span>
										</label>
									))}
								</div>
							</div>
							<div className="form-group">
								<label>Status *</label>
								<select 
									name="status" 
									value={academicYearForm.status} 
									onChange={handleAcademicYearFormChange}
								>
									<option value="Active">Active</option>
									<option value="Inactive">Inactive</option>
									<option value="Completed">Completed</option>
								</select>
							</div>
							<div className="modal-actions full">
								<button 
									type="button" 
									className="btn secondary" 
									disabled={saving}
									onClick={() => !saving && closeModal()}
								>
									Cancel
								</button>
								<button 
									type="submit" 
									className="btn primary" 
									disabled={saving}
								>
									{editingItem ? 'Update Academic Year' : 'Add Academic Year'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default Settings;
