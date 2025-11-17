import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "../axios";
import notifications from '../utils/notifications';
import '../utils/activityBus';
import "../../sass/Students.scss";

const STUDENT_BANNER_IMG = "/images/Student_Manager.png";

const initialState = {
  first_name: "",
  last_name: "",
  email: "",
  gender: "",
  birthdate: "",
  phone: "",
  department: "",
  academic_year: "",
  status: "",
  program: "",
};

const yearFolders = [
  "SY 2020-2021",
  "SY 2021-2022",
  "SY 2022-2023",
  "SY 2023-2024",
  "SY 2024-2025",
];

const departmentSubfolders = {
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
  "Computer Studies": [
    "Computer Science",
    "Information Technology",
    "Information Technology with special training in Computer Animation",
    "Diploma in Information Technology",
    "Library and Information Science",
    "Entertainment and Multimedia Computing"
  ],
  "Engineering Technology": [
    "Civil Engineering",
    "Industrial Engineering"
  ],
  "Teacher Education": [
    "Elementary Education",
    "Early Childhood Education",
    "Physical Education",
    "Special Needs Education",
    "Secondary Education"
  ]
};

const Students = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(initialState);
  const [editId, setEditId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSubDept, setSelectedSubDept] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [customYears, setCustomYears] = useState(() => {
    const saved = localStorage.getItem("studentsCustomYears") || localStorage.getItem("customYears");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYearStart, setNewYearStart] = useState("");
  const [yearMenuOpen, setYearMenuOpen] = useState(null);
  const yearMenuRef = useRef(null);
  const [archivedYears, setArchivedYears] = useState(() => {
    const saved = localStorage.getItem("studentsArchivedYears") || localStorage.getItem("archivedYears");
    return saved ? JSON.parse(saved) : [];
  });
  const [restoredYearLabel, setRestoredYearLabel] = useState("");
  const [addYearError, setAddYearError] = useState("");
  const [departmentsData, setDepartmentsData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [showCourseSelectModal, setShowCourseSelectModal] = useState(false);
  const [pendingDeptCourses, setPendingDeptCourses] = useState([]);
  const courseModalWasShownRef = useRef(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveTargetYear, setArchiveTargetYear] = useState(null);
  const [archiveConfirmText, setArchiveConfirmText] = useState("");
  const [archiveInProgress, setArchiveInProgress] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreTargetYear, setRestoreTargetYear] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  // Typed delete for Year Folder
  const [showDeleteYearConfirm, setShowDeleteYearConfirm] = useState(false);
  const [deleteYearTarget, setDeleteYearTarget] = useState(null);
  const [deleteYearConfirmText, setDeleteYearConfirmText] = useState("");
  const [deleteYearInProgress, setDeleteYearInProgress] = useState(false);
  // NEW: selection + typed delete modal states for single and bulk deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]); // array of student objects
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [removeEditPhoto, setRemoveEditPhoto] = useState(false);
  // Read-only view modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  // Full photo preview state
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [photoPreviewSrcFull, setPhotoPreviewSrcFull] = useState(null);
  const isInteractiveClick = (target) => {
    try {
      return !!(target.closest && target.closest('button, a, input, label, select, textarea, [role="button"], .students-action-btn, .students-folder-menu-btn'));
    } catch (_) { return false; }
  };

  // View / Table mode + sorting
  const [viewMode, setViewMode] = useState('folder'); // 'folder' | 'table'
  const [tableSort, setTableSort] = useState({ field: 'last_name', direction: 'asc' });
  const [tableGrouping, setTableGrouping] = useState('none'); // 'none' | 'folder'

  // Academic Year statuses from Settings (Active, Inactive, Completed, Archived)
  const [ayStatuses, setAyStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('settings_academic_year_statuses') || '{}'); } catch { return {}; }
  });

  const SY_STATUS_KEY = 'settings_academic_year_statuses';
  const SY_STATUS_PREV_KEY = 'settings_academic_year_statuses_prev';

  const setGlobalAcademicYearStatus = useCallback((labelOrYear, nextStatus, source = 'Students') => {
    const raw = labelOrYear ?? '';
    const year = String(raw).replace(/^SY\s*/i, '').trim();
    if (!year) return;

    const normalizedStatus = String(nextStatus || 'Active');

    let statusMap = {};
    let prevStatusMap = {};
    try { statusMap = JSON.parse(localStorage.getItem(SY_STATUS_KEY) || '{}'); } catch (_) {}
    try { prevStatusMap = JSON.parse(localStorage.getItem(SY_STATUS_PREV_KEY) || '{}'); } catch (_) {}

    if (normalizedStatus.toLowerCase() === 'archived') {
      const existing = statusMap[year];
      if (existing && existing.toLowerCase() !== 'archived') {
        prevStatusMap[year] = existing;
      } else if (!prevStatusMap[year]) {
        prevStatusMap[year] = 'Active';
      }
      statusMap[year] = 'Archived';
    } else {
      statusMap[year] = normalizedStatus;
      if (prevStatusMap[year]) {
        delete prevStatusMap[year];
      }
    }

    try {
      localStorage.setItem(SY_STATUS_KEY, JSON.stringify(statusMap));
      localStorage.setItem(SY_STATUS_PREV_KEY, JSON.stringify(prevStatusMap));
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('academicYearStatusUpdated', {
      detail: { year, status: statusMap[year], source },
      bubbles: true
    }));
  }, []);

  const restoreGlobalAcademicYearStatus = useCallback((labelOrYear, source = 'Students') => {
    const raw = labelOrYear ?? '';
    const year = String(raw).replace(/^SY\s*/i, '').trim();
    if (!year) return;

    let prevStatusMap = {};
    try { prevStatusMap = JSON.parse(localStorage.getItem(SY_STATUS_PREV_KEY) || '{}'); } catch (_) {}
    const fallback = String(prevStatusMap[year] || 'Active');
    setGlobalAcademicYearStatus(year, fallback, source);
  }, [setGlobalAcademicYearStatus]);

  const getYearKey = useCallback((labelOrValue) => {
    if (!labelOrValue) return '';
    return String(labelOrValue).replace(/^SY\s*/i, '').trim();
  }, []);

  const getAyStatus = useCallback((labelOrValue) => {
    const key = getYearKey(labelOrValue);
    // Default to Active if not explicitly set in Settings (only block when marked Inactive/Completed)
    return ayStatuses[key] || 'Active';
  }, [ayStatuses, getYearKey]);

  // Year helpers defined early to avoid TDZ/runtime errors when used in memoized selectors below
  function normalizeYearLabel(raw) {
    if (!raw) return "";
    // Accept variants like "SY2024-2025", "2024 - 2025", en/em dashes, single start year
    let yr = String(raw).trim().replace(/^SY\s*/i, "").replace(/[–—]/g, '-');
    // Normalize spaces around hyphen
    yr = yr.replace(/\s*-\s*/g, '-');
    if (/^\d{4}-\d{4}$/.test(yr)) {
      return `SY ${yr}`;
    }
    if (/^\d{4}$/.test(yr)) {
      const s = Number(yr);
      return `SY ${s}-${s + 1}`;
    }
    // Fallback: ensure prefix and cleaned dashes
    const prefixed = `SY ${yr}`;
    return prefixed.trim();
  }

  function matchesSelectedYear(selectedLabel, rawYear) {
    if (!selectedLabel) return true; // no filter
    const sel = normalizeYearLabel(selectedLabel);
    const rawNorm = normalizeYearLabel(rawYear);
    return sel === rawNorm;
  }

  // Note: A global/local normalizeYearLabel(raw) likely exists later in this file; reuse that for formatting labels.

  useEffect(() => {
    const onStatusUpdated = () => {
      try { setAyStatuses(JSON.parse(localStorage.getItem('settings_academic_year_statuses') || '{}')); } catch {}
    };
    window.addEventListener('academicYearStatusUpdated', onStatusUpdated);
    return () => window.removeEventListener('academicYearStatusUpdated', onStatusUpdated);
  }, []);

  const allYearFolders = [...yearFolders, ...customYears];

  useEffect(() => {
    try { localStorage.setItem("studentsCustomYears", JSON.stringify(customYears)); } catch (_) {}
  }, [customYears]);

  useEffect(() => {
    try { localStorage.setItem("studentsArchivedYears", JSON.stringify(archivedYears)); } catch (_) {}
  }, [archivedYears]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("/api/students");
        setStudents(res.data.students || []);
      } catch (err) {
        setError("Failed to fetch students.");
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("/api/departments");
        setDepartmentsData(res.data.departments || []);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get("/api/courses");
      setCoursesData(res.data.courses || []);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    const handleCourseChange = () => fetchCourses();
    window.addEventListener("courseAdded", handleCourseChange);
    window.addEventListener("courseUpdated", handleCourseChange);
    window.addEventListener("courseDeleted", handleCourseChange);
    const handleAcademicYearAdded = (e) => {
      const detail = e?.detail || {};
      if (detail.target !== 'Students') return;
      const label = detail.label;
      if (!label) return;
      setCustomYears((prev) => {
        if (prev.includes(label)) return prev;
        const updated = [...prev, label];
        try { localStorage.setItem('studentsCustomYears', JSON.stringify(updated)); } catch (_) {}
        return updated;
      });
      notifications.add(`School Year folder ${label} added from Settings.`);
    };
    const handleAcademicYearArchived = (e) => {
      const label = e?.detail?.label;
      if (!label) return;
      setArchivedYears(prev => {
        if (prev.includes(label)) return prev;
        const updated = [...prev, label];
        try { localStorage.setItem('studentsArchivedYears', JSON.stringify(updated)); } catch (_) {}
        return updated;
      });
    };
    const handleAcademicYearRestored = (e) => {
      const label = e?.detail?.label;
      if (!label) return;
      setArchivedYears(prev => {
        const updated = prev.filter(y => y !== label);
        try { localStorage.setItem('studentsArchivedYears', JSON.stringify(updated)); } catch (_) {}
        return updated;
      });
    };
    window.addEventListener('academicYearAdded', handleAcademicYearAdded);
    window.addEventListener('academicYearArchived', handleAcademicYearArchived);
    window.addEventListener('academicYearRestored', handleAcademicYearRestored);
    return () => {
      window.removeEventListener("courseAdded", handleCourseChange);
      window.removeEventListener("courseUpdated", handleCourseChange);
      window.removeEventListener("courseDeleted", handleCourseChange);
      window.removeEventListener('academicYearAdded', handleAcademicYearAdded);
      window.removeEventListener('academicYearArchived', handleAcademicYearArchived);
      window.removeEventListener('academicYearRestored', handleAcademicYearRestored);
    };
  }, [fetchCourses]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const clearAddPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      clearAddPhoto();
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const clearEditPhoto = () => {
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setRemoveEditPhoto(true);
  };

  const handleEditPhotoChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      event.target.value = "";
      return;
    }
    setEditPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    event.target.value = "";
    setRemoveEditPhoto(false);
  };

  const openViewStudent = (stu) => {
    setViewStudent(stu);
    setViewModalOpen(true);
  };

  const closeViewStudent = () => {
    setViewModalOpen(false);
    setViewStudent(null);
  };

  const handleRowClick = (stu) => (e) => {
    if (selectionMode) return;
    if (isInteractiveClick(e.target)) return;
    openViewStudent(stu);
  };

  const openAddStudentModal = () => {
    setForm({ ...initialState });
    setError("");
    setMessage("");
    clearAddPhoto();
    setShowModal(true);
  };

  const closeAddStudentModal = () => {
    setShowModal(false);
    clearAddPhoto();
  };

  const closeEditStudentModal = () => {
    setEditModal(false);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setRemoveEditPhoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.academic_year) {
      setError("Please select a School Year.");
      return;
    }
    // Block adding to Inactive or Completed SY
    const chosenStatus = getAyStatus(form.academic_year);
    if (['inactive','completed'].includes(String(chosenStatus).toLowerCase())) {
      setError(`You cannot add a student to ${normalizeYearLabel(form.academic_year)} because it is marked as ${chosenStatus}.`);
      return;
    }
    // Normalize label once for downstream events & status bookkeeping
    const label = normalizeYearLabel(form.academic_year);

    // Broadcast to Settings so it reflects immediately in Academic Years
    try {
      window.dispatchEvent(new CustomEvent('academicYearAdded', {
        detail: { target: 'Students', label },
        bubbles: true
      }));
    } catch (_) {}

    // Ensure the global AY status map includes this year (default Active)
    try {
      const key = label.replace(/^SY\s*/i, '');
      const map = JSON.parse(localStorage.getItem('settings_academic_year_statuses') || '{}');
      if (!map[key]) {
        map[key] = 'Active';
        localStorage.setItem('settings_academic_year_statuses', JSON.stringify(map));
        window.dispatchEvent(new CustomEvent('academicYearStatusUpdated', { detail: { statuses: map } }));
      }
    } catch (_) {}

    if (!form.department) {
      setError("Please select a Department.");
      return;
    }
    // Guard against archived department selection
    const selectedDeptObj = (departmentsData || []).find(
      d => (d?.name || "").trim().toLowerCase() === form.department.trim().toLowerCase()
    );
    if (selectedDeptObj && (selectedDeptObj.status || "").toLowerCase() === "archived") {
      setError("The selected department is archived and cannot be chosen.");
      return;
    }
    if (!form.first_name || !form.last_name || !form.email) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.birthdate && new Date(form.birthdate) > new Date()) {
      setError("Birthdate cannot be in the future.");
      return;
    }
    // Guard against archived course selection (for dynamic course-driven programs)
    if (form.program && !departmentSubfolders[form.department]) {
      const deptLower = form.department.trim().toLowerCase();
      const courseMatch = (coursesData || []).find(c =>
        ((c.department || c.program || "").trim().toLowerCase()) === deptLower &&
        ((c.name || c.program || "").trim().toLowerCase()) === form.program.trim().toLowerCase()
      );
      if (courseMatch && (courseMatch.status || "").toLowerCase() === "archived") {
        setError("The selected course/program is archived and cannot be chosen.");
        return;
      }
    }

    const submitData = { ...form };
    if (submitData.academic_year.startsWith("SY ")) {
      submitData.academic_year = submitData.academic_year.replace(/^SY\s*/, "");
    }
    if (!departmentSubfolders[form.department] && !submitData.program) {
      delete submitData.program;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(submitData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await axios.post("/api/students", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const depRes = await axios.get("/api/departments");
      setDepartmentsData(depRes.data.departments || []);

      const courseRes = await axios.get("/api/courses");
      setCoursesData(courseRes.data.courses || []);

      const newStudent = res.data.student || submitData;
      setStudents((prev) => [
        ...(prev || []),
        newStudent
      ]);
      
      notifications.add(`Student ${submitData.first_name} ${submitData.last_name} added successfully!`);
      
      window.dispatchEvent(new CustomEvent('studentAdded', {
        detail: newStudent,
        bubbles: true
      }));
      // Auto-navigate the UI to the student's destination folder
      try {
        const yearLabel = normalizeYearLabel(form.academic_year);
        setSelectedYear(yearLabel || null);
        setSelectedDept(form.department || null);
        const programName = newStudent.program || form.program || null;
        setSelectedSubDept(programName);
        setSelectedCourse(programName);
        setShowArchived(false);
      } catch (_) {}
      
  closeAddStudentModal();
  setForm({ ...initialState });
      
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessage = Object.values(errors).map((arr) => arr.join(" ")).join(" ");
        notifications.info(`Error: ${errorMessage}`);
      } else {
        notifications.info(err.response?.data?.message || "Failed to add student.");
      }
    }
    setLoading(false);
  };

  const handleEdit = (student) => {
    const filledStudent = { ...initialState, ...student };

    let department = filledStudent.department;
    let program = filledStudent.program;

    let foundDept = null;
    Object.entries(departmentSubfolders).forEach(([dept, programs]) => {
      if (programs.includes(filledStudent.department)) {
        foundDept = dept;
        program = filledStudent.department;
      }
      if (programs.includes(filledStudent.program)) {
        foundDept = dept;
        program = filledStudent.program;
      }
    });

    if (foundDept) {
      department = foundDept;
    }

    if (departmentSubfolders[department] && !program) {
      if (departmentSubfolders[department].length === 1) {
        program = departmentSubfolders[department][0];
      }
    }

    setEditForm({
      ...filledStudent,
      department: department || "",
      program: program || "",
    });
    setEditId(filledStudent.id);
    setEditPhotoFile(null);
    setEditPhotoPreview(filledStudent.photo_url || filledStudent.avatar || null);
    setRemoveEditPhoto(false);
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError("");
    try {
      const payload = { ...editForm };
      if (payload.academic_year && payload.academic_year.startsWith("SY ")) {
        payload.academic_year = payload.academic_year.replace(/^SY\s*/, "");
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      if (editPhotoFile) {
        formData.append('photo', editPhotoFile);
      }
      if (removeEditPhoto && !editPhotoFile) {
        formData.append('remove_photo', '1');
      }
      formData.append('_method', 'PUT');

      await axios.post(`/api/students/${editId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const refreshed = await axios.get("/api/students");
      const allStudents = refreshed.data.students || [];
      setStudents(allStudents);
      const updatedStudent = allStudents.find((stu) => stu.id === editId);
      closeEditStudentModal();
      
      notifications.edit(`Student ${editForm.first_name} ${editForm.last_name} updated successfully!`);

      window.dispatchEvent(new CustomEvent('studentUpdated', {
        detail: updatedStudent || { ...editForm, id: editId },
        bubbles: true
      }));
      
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Failed to update student.");
      notifications.info(`Error: ${errorMessage}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddYear = (e) => {
    e.preventDefault();
    setAddYearError("");
    const trimmed = newYearStart.trim();
    if (!/^\d{4}-\d{4}$/.test(trimmed)) {
      setAddYearError("Please enter a valid format (e.g. 2025-2026).");
      return;
    }
    const label = `SY ${trimmed}`;
    const exists = allYearFolders.some(
      (y) => y.toLowerCase() === label.toLowerCase()
    );
    if (exists) {
      setAddYearError("This School Year folder already exists.");
      return;
    }
    setCustomYears((prev) => [...prev, label]);
    
    notifications.add(`School Year folder ${label} added successfully!`);
    
    setShowAddYearModal(false);
    setNewYearStart("");
  };

  const handleDeleteYear = (label) => {
    // Open typed confirmation modal for deleting a School Year folder
    setDeleteYearTarget(label);
    setDeleteYearConfirmText("");
    setShowDeleteYearConfirm(true);
  };

  const confirmDeleteYear = async () => {
    if (deleteYearConfirmText !== "Delete" || !deleteYearTarget) return;
    setDeleteYearInProgress(true);
    const label = deleteYearTarget;
    try {
      setCustomYears((prev) => prev.filter((y) => y !== label));
      setYearMenuOpen(null);
      notifications.delete(`School Year folder ${label} deleted successfully!`);
    } finally {
      setDeleteYearInProgress(false);
      setShowDeleteYearConfirm(false);
      setDeleteYearTarget(null);
      setDeleteYearConfirmText("");
    }
  };

  const archiveYear = (year) => {
    setArchivedYears(prev => {
      if (prev.includes(year)) return prev;
      const updated = [...prev, year];
      try {
        localStorage.setItem("studentsArchivedYears", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    
    notifications.info(`School Year folder ${year} archived successfully!`);
  };

  const requestArchiveYear = (year) => {
    setArchiveTargetYear(year);
    setArchiveConfirmText("");
    setShowArchiveConfirm(true);
  };

  const confirmArchiveYear = async () => {
    if (archiveConfirmText !== "Archive" || !archiveTargetYear) return;
    setArchiveInProgress(true);

    const label = archiveTargetYear;
    try {
      archiveYear(label);
      setGlobalAcademicYearStatus(label, 'Archived', 'Students');
      window.dispatchEvent(new CustomEvent('studentYearArchived', {
        detail: { label },
        bubbles: true
      }));
    } finally {
      setArchiveInProgress(false);
      setShowArchiveConfirm(false);
      setArchiveTargetYear(null);
    }
  };

  const requestRestoreYear = (year) => {
    setRestoreTargetYear(year);
    setRestoreConfirmText("");
    setShowRestoreConfirm(true);
  };

  const confirmRestoreYear = async () => {
    if (restoreConfirmText !== "Restore" || !restoreTargetYear) return;
    setRestoreInProgress(true);

    const label = restoreTargetYear;
    try {
      setArchivedYears((prev) => prev.filter((y) => y !== label));
      restoreGlobalAcademicYearStatus(label, 'Students');
      notifications.edit(`School Year folder ${label} has been restored from the archives!`);
      window.dispatchEvent(new CustomEvent('studentYearRestored', {
        detail: { label },
        bubbles: true
      }));
    } finally {
      setRestoreInProgress(false);
      setShowRestoreConfirm(false);
      setRestoreTargetYear(null);
    }
  };

  useEffect(() => {
    if (!yearMenuOpen) return;
    const handleClickOutside = (event) => {
      if (
        yearMenuRef.current &&
        !yearMenuRef.current.contains(event.target)
      ) {
        setYearMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [yearMenuOpen]);

  const filteredStudents = students.filter(stu => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (stu.first_name && stu.first_name.toLowerCase().includes(query)) ||
      (stu.last_name && stu.last_name.toLowerCase().includes(query)) ||
      (stu.id && String(stu.id).includes(query)) ||
      (stu.email && stu.email.toLowerCase().includes(query)) ||
      (stu.department && stu.department.toLowerCase().includes(query)) ||
      (stu.program && stu.program.toLowerCase().includes(query))
    );
  });

  const isSearchActive = search.trim().length > 0;

  const studentsByYearDept = {};

  filteredStudents.forEach((stu) => {
    let yearFolder = "";

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

  const visibleYearFolders = allYearFolders.filter(
    (label) => !archivedYears.includes(label)
  );

  const handleDeleteClick = async (student) => {
    // Open typed confirmation modal for single delete
    setDeleteTargets([student]);
    setDeleteConfirmText("");
    setShowDeleteConfirm(true);
  };

  const getCurrentVisibleList = useCallback(() => {
    // Table view: use visibleTableStudents (search + optional year/department filters)
    if (viewMode === 'table') {
      return filteredStudents.filter(stu => {
        if (!matchesSelectedYear(selectedYear, stu.academic_year)) return false;
        if (selectedDept && (stu.department || '').trim().toLowerCase() !== selectedDept.trim().toLowerCase()) return false;
        return true;
      });
    }
    // Determine which list is visible for selection/bulk actions
    if (selectedCourse) {
      return filteredStudents.filter(stu => {
        const stuYear = normalizeYearLabel(stu.academic_year);
        return (
          stuYear === selectedYear &&
          (stu.program || "").trim().toLowerCase() === selectedCourse.trim().toLowerCase()
        );
      });
    }
    if (selectedYear && (selectedSubDept || selectedDept)) {
      const key = selectedSubDept || selectedDept;
      return (
        (studentsByYearDept[selectedYear] && studentsByYearDept[selectedYear][key]) || []
      );
    }
    if (!selectedYear && !showArchived && isSearchActive) {
      return filteredStudents;
    }
    return [];
  }, [filteredStudents, isSearchActive, selectedCourse, selectedDept, selectedSubDept, selectedYear, showArchived, studentsByYearDept]);

  // Sorting helpers for table view
  const visibleTableStudents = useMemo(() => {
    return filteredStudents.filter(stu => {
      if (!matchesSelectedYear(selectedYear, stu.academic_year)) return false;
      if (selectedDept && (stu.department || '').trim().toLowerCase() !== selectedDept.trim().toLowerCase()) return false;
      return true;
    });
  }, [filteredStudents, selectedYear, selectedDept, matchesSelectedYear]);

  const sortedTableStudents = useMemo(() => {
    const arr = [...visibleTableStudents];
    const { field, direction } = tableSort;
    const dir = direction === 'asc' ? 1 : -1;
    const val = (stu) => {
      switch(field) {
        case 'name': return `${(stu.last_name||'').toLowerCase()} ${(stu.first_name||'').toLowerCase()}`.trim();
        case 'department': return (stu.department||'').toLowerCase();
        case 'program': return (stu.program||'').toLowerCase();
        case 'academic_year': return normalizeYearLabel(stu.academic_year).toLowerCase();
        case 'status': return (stu.status||'').toLowerCase();
        case 'updated_at': return stu.updated_at ? new Date(stu.updated_at).getTime() : 0;
        case 'id': return Number(stu.id) || 0;
        default: return `${(stu.last_name||'').toLowerCase()} ${(stu.first_name||'').toLowerCase()}`.trim();
      }
    };
    arr.sort((a,b) => {
      const va = val(a); const vb = val(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [visibleTableStudents, tableSort, normalizeYearLabel]);

  const groupedSortedRows = useMemo(() => {
    if (tableGrouping !== 'folder') return sortedTableStudents.map(stu => ({ type: 'row', stu }));
    const rows = [];
    let currentGroup = null;
    sortedTableStudents.forEach(stu => {
      const groupKey = `${normalizeYearLabel(stu.academic_year)} | ${(stu.department||'').trim()}${stu.program&&stu.program!==stu.department? ` | ${stu.program}`:''}`;
      if (groupKey !== currentGroup) {
        currentGroup = groupKey;
        rows.push({ type: 'group', key: groupKey });
      }
      rows.push({ type: 'row', stu });
    });
    return rows;
  }, [sortedTableStudents, tableGrouping, normalizeYearLabel]);

  const toggleSortField = (field) => {
    setTableSort(prev => prev.field === field ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'asc' });
  };

  const toggleSelectAll = () => {
    const list = getCurrentVisibleList();
    const allIds = new Set(list.map(s => s.id));
    let next = new Set(selectedIds);
    const allSelected = list.length > 0 && list.every(s => selectedIds.has(s.id));
    if (allSelected) {
      // clear only those in current view
      list.forEach(s => next.delete(s.id));
    } else {
      allIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const openBulkDelete = () => {
    const list = getCurrentVisibleList();
    const targets = list.filter(s => selectedIds.has(s.id));
    if (targets.length === 0) return;
    setDeleteTargets(targets);
    setDeleteConfirmText("");
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudents = async () => {
    if (deleteConfirmText !== "Delete" || deleteTargets.length === 0) return;
    setDeleteInProgress(true);
    try {
      if (deleteTargets.length === 1) {
        const s = deleteTargets[0];
        await axios.delete(`/api/students/${s.id}`);
        setStudents(prev => (prev || []).filter(x => x.id !== s.id));
        notifications.delete(`Student ${s.first_name} ${s.last_name} deleted successfully!`);
        try { window.dispatchEvent(new CustomEvent('studentDeleted', { detail: s, bubbles: true })); } catch (_) {}
      } else {
        const ids = deleteTargets.map(s => s.id);
        const names = deleteTargets.map(s => `${s.first_name} ${s.last_name}`);
        const results = await Promise.allSettled(ids.map(id => axios.delete(`/api/students/${id}`)));
        const successIds = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'));
        setStudents(prev => (prev || []).filter(x => !successIds.has(x.id)));
        const successCount = successIds.size;
        if (successCount > 0) {
          notifications.delete(`Deleted ${successCount} student${successCount > 1 ? 's' : ''}.`);
        }
        // emit events for each successfully deleted
        deleteTargets.forEach((s, i) => {
          if (results[i].status === 'fulfilled') {
            try { window.dispatchEvent(new CustomEvent('studentDeleted', { detail: s, bubbles: true })); } catch (_) {}
          }
        });
      }
    } catch (e) {
      notifications.info('Failed to delete some students.');
    } finally {
      setDeleteInProgress(false);
      setShowDeleteConfirm(false);
      setDeleteTargets([]);
      setDeleteConfirmText("");
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  // Reset selection when navigating folders
  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [selectedYear, selectedDept, selectedSubDept, selectedCourse, isSearchActive]);

  useEffect(() => {
    if (showArchived) {
      setSelectedYear(null);
      setSelectedDept(null);
      setSelectedSubDept(null);
    }
  }, [showArchived]);

  const getStudentCountForYear = (label) => {
    if (studentsByYearDept[label]) {
      return Object.values(studentsByYearDept[label]).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
    }
    return 0;
  };

  // moved earlier as function declarations

  const coursesForSelectedDept = useMemo(() => {
    if (!selectedDept || !coursesData || coursesData.length === 0) return [];
    const deptLower = selectedDept.trim().toLowerCase();
    return coursesData.filter(c => {
      const prog = (c.program || "").trim().toLowerCase();
      const dept = (c.department || "").trim().toLowerCase();
      return prog === deptLower || dept === deptLower;
    });
  }, [coursesData, selectedDept]);

  const availablePrograms = useMemo(() => {
    if (!form.department) return [];
    const deptLower = form.department.trim().toLowerCase();
    const programs = coursesData
      .filter(course => {
        const matchDept = ((course.department || course.program || "").trim().toLowerCase()) === deptLower;
        const isArchived = (course.status || "").toLowerCase() === "archived";
        return matchDept && !isArchived;
      })
      .map(course => (course.name || course.program || "").trim())
      .filter(Boolean);
    return Array.from(new Set(programs));
  }, [coursesData, form.department]);

  useEffect(() => {
    if (!form.department) return;
    if (departmentSubfolders[form.department]) return;
    const deptLower = form.department.trim().toLowerCase();
    const matches = coursesData.filter(c => {
      const matchDept = ((c.department || c.program || "").trim().toLowerCase()) === deptLower;
      return matchDept; // include all for modal; we'll disable archived in UI
    });
    if (matches.length > 0 && !form.program && !courseModalWasShownRef.current) {
      setPendingDeptCourses(matches);
      setShowCourseSelectModal(true);
      courseModalWasShownRef.current = true;
    }
  }, [coursesData, form.department, form.program]);

  return (
    <div className="students-root">
      {showArchiveConfirm && (
        <div
          className="students-modal-bg"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2500
          }}
          onClick={() => !archiveInProgress && setShowArchiveConfirm(false)}
        >
          <div
            className="students-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 440,
              padding: "32px 36px",
              borderRadius: 22,
              boxShadow: "0 8px 28px rgba(0,0,0,.18)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Archive School Year Folder</h3>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: "#374151", marginBottom: 18 }}>
              
              <br />
              <b>{archiveTargetYear}</b>
              <br />
              
              <br />
              Type <code style={{ background: "#f3f4f6", padding: "2px 4px", borderRadius: 4 }}>Archive</code> to confirm.
            </div>
            <input
              autoFocus
              type="text"
              placeholder='Type "Archive" to confirm'
              value={archiveConfirmText}
              onChange={(e) => setArchiveConfirmText(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                marginBottom: 20,
                fontSize: 14
              }}
              disabled={archiveInProgress}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={archiveInProgress}
                style={{
                  background: "#e5e7eb",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: archiveInProgress ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmArchiveYear}
                disabled={archiveConfirmText !== "Archive" || archiveInProgress}
                style={{
                  background:
                    archiveConfirmText === "Archive" && !archiveInProgress
                      ? "#dc2626"
                      : "#fca5a5",
                  color: "#fff",
                  border: "none",
                  padding: "8px 22px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor:
                    archiveConfirmText === "Archive" && !archiveInProgress
                      ? "pointer"
                      : "not-allowed"
                }}
              >
                {archiveInProgress ? "Archiving..." : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreConfirm && (
        <div
          className="students-modal-bg"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2500
          }}
          onClick={() => !restoreInProgress && setShowRestoreConfirm(false)}
        >
          <div
            className="students-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 440,
              padding: "32px 36px",
              borderRadius: 22,
              boxShadow: "0 8px 28px rgba(0,0,0,.18)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Restore School Year Folder</h3>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: "#374151", marginBottom: 18 }}>
              
              <br />
              <b>{restoreTargetYear}</b>
              <br />
              
              <br />
              Type <code style={{ background: "#f3f4f6", padding: "2px 4px", borderRadius: 4 }}>Restore</code> to confirm.
            </div>
            <input
              autoFocus
              type="text"
              placeholder='Type "Restore" to confirm'
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                marginBottom: 20,
                fontSize: 14
              }}
              disabled={restoreInProgress}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                disabled={restoreInProgress}
                style={{
                  background: "#e5e7eb",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: restoreInProgress ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestoreYear}
                disabled={restoreConfirmText !== "Restore" || restoreInProgress}
                style={{
                  background:
                    restoreConfirmText === "Restore" && !restoreInProgress
                      ? "#16a34a"
                      : "#bbf7d0",
                  color: "#fff",
                  border: "none",
                  padding: "8px 22px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor:
                    restoreConfirmText === "Restore" && !restoreInProgress
                      ? "pointer"
                      : "not-allowed"
                }}
              >
                {restoreInProgress ? "Restoring..." : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteYearConfirm && (
        <div
          className="students-modal-bg"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2550 }}
          onClick={() => !deleteYearInProgress && setShowDeleteYearConfirm(false)}
        >
          <div className="students-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 460, padding: '28px 32px', borderRadius: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Delete School Year Folder</h3>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, marginBottom: 16 }}>
              This action is permanent and cannot be undone.
              <br />
              Folder: <b>{deleteYearTarget}</b>
              <br />
              <br />
              Type <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>Delete</code> to confirm.
            </div>
            <input
              autoFocus
              type="text"
              placeholder='Type "Delete" to confirm'
              value={deleteYearConfirmText}
              onChange={(e) => setDeleteYearConfirmText(e.target.value)}
              disabled={deleteYearInProgress}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowDeleteYearConfirm(false)} disabled={deleteYearInProgress}
                style={{ background: '#e5e7eb', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 700 }}
              >
                Cancel
              </button>
              <button type="button" onClick={confirmDeleteYear}
                disabled={deleteYearConfirmText !== 'Delete' || deleteYearInProgress}
                style={{ background: deleteYearConfirmText === 'Delete' && !deleteYearInProgress ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 700, cursor: deleteYearConfirmText === 'Delete' && !deleteYearInProgress ? 'pointer' : 'not-allowed' }}
              >
                {deleteYearInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="students-banner">
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
            className="students-banner-icon"
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
              flexShrink: 0,
            }}
          >
            <img
              src={STUDENT_BANNER_IMG}
              alt="Student Management"
              style={{ width: "70%", height: "70%", objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.parentElement.style.display = "none";
              }}
            />
          </div>
          <div style={{ minWidth: 200 }}>
            <div className="students-banner-title" style={{ marginBottom: 4 }}>
              Student Management
            </div>
            <div className="students-banner-sub" style={{ lineHeight: 1.25 }}>
              FSUU - Manage student records and academic information
            </div>
          </div>
        </div>
        <div className="students-banner-actions" style={{ marginLeft: "auto" }}>
           <button
             className="students-banner-archived"
             onClick={() => setShowArchived(!showArchived)}
           >
             {showArchived ? "Hide Archived" : "Show Archived"}
           </button>
           <button
             className="students-banner-add"
             onClick={openAddStudentModal}
           >
             + Add Student
           </button>
         </div>
       </div>
      
      <div
        style={{
          margin: "32px 0 0 0",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: 'wrap',
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px #0001",
          padding: "18px 32px",
          maxWidth: "98%",
          width: "98%",
          marginLeft: "auto",
          marginRight: "auto"
        }}
      >
        <input
          type="text"
          placeholder="Search students by name, email, ID, or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              setSelectedYear(null);
              setSelectedDept(null);
              setSelectedSubDept(null);
            }
          }}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: "1rem",
            outline: "none",
            boxShadow: "0 1px 2px #0001"
          }}
        />
        <div style={{ display: "flex", gap: 12 }}>
          <select
            className="students-filter-select"
            value={selectedYear || ""}
            onChange={e => setSelectedYear(e.target.value || null)}
          >
            <option value="">All Years</option>
            {allYearFolders.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="students-filter-select all-departments"
            value={selectedDept || ""}
            onChange={e => setSelectedDept(e.target.value || null)}
          >
            <option value="">All Departments</option>
            {departmentsData.map(dept => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button
              type="button"
              onClick={() => setViewMode('folder')}
              style={{
                background: viewMode==='folder'? '#6366f1':'#e5e7eb',
                color: viewMode==='folder'? '#fff':'#374151',
                border:'none', padding:'8px 14px', borderRadius:10, fontWeight:600,
                cursor:'pointer', minWidth:100
              }}
            >Folder View</button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode==='table'? '#6366f1':'#e5e7eb',
                color: viewMode==='table'? '#fff':'#374151',
                border:'none', padding:'8px 14px', borderRadius:10, fontWeight:600,
                cursor:'pointer', minWidth:100
              }}
            >Table View</button>
          </div>
          {/* Grouping control removed per request */}
        </div>
      </div>
      
      <div className="students-list-card">
        {viewMode==='folder' && !selectedYear && !showArchived && !isSearchActive && (
          <div className="students-folders-container">
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {visibleYearFolders.map((label) => {
                const total = getStudentCountForYear(label);
                const status = getAyStatus(label);
                const statusLC = String(status).toLowerCase();
                const borderColor = statusLC === 'active' ? '#16a34a' : statusLC === 'inactive' ? '#f59e0b' : statusLC === 'completed' ? '#0ea5e9' : '#e5e7eb';
                const dotColor = borderColor;
                return (
                  <div key={label} className="students-folder" style={{ borderLeft: `6px solid ${borderColor}` }}>
                    <div
                      style={{ display: "flex", alignItems: "center", flex: 1 }}
                      onClick={() => setSelectedYear(label)}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="#6366f1"
                        style={{ marginRight: 16 }}
                      >
                        <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                      </svg>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {label}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: `${dotColor}1A`, color: dotColor, border: `1px solid ${dotColor}44`,
                          padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                          {status}
                        </span>
                      </span>
                      <span
                        style={{
                          marginLeft: 12,
                          background: "#e0e7ff",
                          color: "#6366f1",
                          borderRadius: 8,
                          padding: "2px 12px",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {total}
                      </span>
                    </div>
                    <div
                      style={{ position: "relative" }}
                      ref={yearMenuOpen === label ? yearMenuRef : null}
                    >
                      <button
                        className="students-folder-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setYearMenuOpen(yearMenuOpen === label ? null : label);
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="black">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                      {yearMenuOpen === label && (
                        <div
                          className="students-folder-menu-dropdown"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="menu-item"
                            onClick={() => requestArchiveYear(label)}
                          >
                            Archive
                          </div>
                          <div
                            className="menu-item danger"
                            onClick={() => handleDeleteYear(label)}
                          >
                            Delete
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode==='folder' && !selectedYear && showArchived && (
          <div className="students-folders-container">
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {archivedYears.length === 0 && (
                <div style={{ color: "#888", padding: 32 }}>No archived folders.</div>
              )}
              {archivedYears.map((label) => (
                <div key={label} className="students-folder archived">
                  <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="#6366f1"
                      style={{ marginRight: 16 }}
                    >
                      <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                    </svg>
                    {label}
                  </div>
                  <button
                    className="students-folder-restore-btn"
                    onClick={() => requestRestoreYear(label)}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode==='folder' && selectedYear && !selectedDept && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                {selectedYear}
              </div>
              <button
                style={{
                  background: "#eee",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => setSelectedYear(null)}
              >
                Back
              </button>
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px #0001",
                padding: "16px",
                marginTop: "16px",
              }}
            >
              {departmentsData.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
                  No departments found.
                </div>
              ) : (
                departmentsData.map((dept) => {
                  const countForDept = students.filter((stu) => {
                    let stuYear = stu.academic_year || "";
                    if (!stuYear.startsWith("SY ")) {
                      stuYear = `SY ${stuYear}`;
                    }
                    return (
                      stu.department.trim().toLowerCase() === dept.name.trim().toLowerCase() &&
                      stuYear === selectedYear
                    );
                  }).length;

                  return (
                    <div
                      key={dept.id}
                      className="students-folder"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 16,
                        padding: "12px 16px",
                        border: "1px solid #eee",
                        borderRadius: 8,
                        background: "#fafafa",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedDept(dept.name)}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="#6366f1"
                        style={{ marginRight: 16 }}
                      >
                        <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                      </svg>
                      <div style={{ flex: 1, fontWeight: 600 }}>
                        {dept.name}
                      </div>
                      <span
                        style={{
                          background: "#e0e7ff",
                          color: "#6366f1",
                          borderRadius: 8,
                          padding: "2px 12px",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {countForDept}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {viewMode==='folder' && selectedYear &&
          selectedDept &&
          !selectedSubDept &&
          !selectedCourse &&
          (coursesForSelectedDept.length > 0 || departmentSubfolders[selectedDept]) && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                {selectedDept}{" "}
                <span style={{ fontWeight: 400, color: "#888" }}>
                  ({selectedYear})
                </span>
              </div>
              <button
                style={{
                  background: "#eee",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => {
                  setSelectedDept(null);
                  setSelectedSubDept(null);
                  setSelectedCourse(null);
                }}
              >
                Back to Departments
              </button>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px #0001",
                padding: 0,
                marginTop: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 32px 12px 32px",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span>
                  {coursesForSelectedDept.length > 0 ? "Courses" : "Programs"}
                </span>
                <span>Number of Students</span>
              </div>

              {coursesForSelectedDept.length > 0 &&
                coursesForSelectedDept.map(course => {
                  const courseName = course.name || "Untitled Course";
                  const count = students.filter(stu => {
                    const stuYear = normalizeYearLabel(stu.academic_year);
                    return (
                      stuYear === selectedYear &&
                      (stu.program || "").trim().toLowerCase() ===
                        courseName.trim().toLowerCase()
                    );
                  }).length;
                  return (
                    <div
                      key={course.id || courseName}
                      className="students-folder"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        padding: "18px 32px",
                        borderBottom: "1px solid #eee",
                        background: "#fff",
                        fontWeight: 500,
                        fontSize: "1.05rem",
                        transition: "background 0.2s",
                      }}
                      onClick={() => setSelectedCourse(courseName)}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="#6366f1"
                          style={{ marginRight: 14 }}
                        >
                          <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                        </svg>
                        {courseName}
                      </div>
                      <span
                        style={{
                          color: "#6366f1",
                          background: "#e0e7ff",
                          borderRadius: 8,
                          padding: "2px 16px",
                          fontSize: "0.95rem",
                          fontWeight: 600,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}

              {coursesForSelectedDept.length === 0 &&
                departmentSubfolders[selectedDept] &&
                departmentSubfolders[selectedDept].map(prog => {
                  const count =
                    (studentsByYearDept[selectedYear] &&
                      studentsByYearDept[selectedYear][prog])
                      ? studentsByYearDept[selectedYear][prog].length
                      : 0;
                  return (
                    <div
                      key={prog}
                      className="students-folder"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        padding: "18px 32px",
                        borderBottom: "1px solid #eee",
                        background: "#fff",
                        fontWeight: 500,
                        fontSize: "1.05rem",
                        transition: "background 0.2s",
                      }}
                      onClick={() => setSelectedSubDept(prog)}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="#6366f1"
                          style={{ marginRight: 14 }}
                        >
                          <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                        </svg>
                        {prog}
                      </div>
                      <span
                        style={{
                          color: "#6366f1",
                          background: "#e0e7ff",
                          borderRadius: 8,
                          padding: "2px 16px",
                          fontSize: "0.95rem",
                          fontWeight: 600,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {viewMode==='folder' && selectedYear && (
          (
            selectedCourse ||
            selectedSubDept ||
            (selectedDept &&
              !selectedCourse &&
              !selectedSubDept &&
              coursesForSelectedDept.length === 0 &&
              !departmentSubfolders[selectedDept])
          )
        ) && (
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                {selectedCourse
                  ? `Course: ${selectedCourse}`
                  : selectedSubDept
                  ? selectedSubDept
                  : selectedDept}{" "}
                <span style={{ fontWeight: 400, color: "#888" }}>
                  ({selectedYear})
                </span>
              </div>
              <button
                style={{
                  background: "#eee",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => {
                  if (selectedCourse) setSelectedCourse(null);
                  else if (selectedSubDept) setSelectedSubDept(null);
                  else setSelectedDept(null);
                }}
              >
                {selectedCourse
                  ? "Back to Courses"
                  : selectedSubDept
                  ? "Back to Programs"
                  : "Back to Departments"}
              </button>
            </div>

            <div className="students-list-table">
              {/* Selection toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 8px 0' }}>
                {!selectionMode ? (
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    style={{
                      background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                      padding: '6px 12px', borderRadius: 8, fontWeight: 700
                    }}
                  >
                    Select
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, userSelect: 'none', cursor: 'pointer' }}>
                      <input type="checkbox" onChange={toggleSelectAll}
                        checked={(() => { const list = getCurrentVisibleList(); return list.length > 0 && list.every(s => selectedIds.has(s.id)); })()}
                      />
                      Select all
                    </label>
                    <button type="button" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
                      style={{ background: '#e5e7eb', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button type="button" onClick={openBulkDelete} disabled={[...selectedIds].length === 0}
                      style={{
                        background: [...selectedIds].length === 0 ? '#fecaca' : '#ef4444', color: '#fff',
                        border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700,
                        cursor: [...selectedIds].length === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Delete Selected ({[...selectedIds].length})
                    </button>
                  </div>
                )}
              </div>
              <div className="students-list-header">
                {selectionMode && <div style={{ width: 28 }}>&nbsp;</div>}
                <div>Student</div>
                <div>Contact</div>
                <div>Status</div>
                <div>Last Updated</div>
                <div>Actions</div>
              </div>

              {(() => {
                if (selectedCourse) {
                  const list = filteredStudents.filter(stu => {
                    const stuYear = normalizeYearLabel(stu.academic_year);
                    return (
                      stuYear === selectedYear &&
                      (stu.program || "").trim().toLowerCase() ===
                        selectedCourse.trim().toLowerCase()
                    );
                  });
                  if (list.length === 0) {
                    return (
                      <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
                        No students found for this course.
                      </div>
                    );
                  }
                  return list.map(stu => (
                    <div className="students-list-row" key={stu.id} onClick={handleRowClick(stu)} style={{ cursor: selectionMode ? 'default' : 'pointer' }}>
                      {selectionMode && (
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(stu.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(stu.id); else next.delete(stu.id);
                              setSelectedIds(next);
                            }}
                          />
                        </div>
                      )}
                      <div className="students-list-student">
                        <img
                          src={stu.photo_url || stu.avatar || "/avatar1.png"}
                          alt={stu.first_name + " " + stu.last_name}
                          className="students-list-avatar"
                        />
                        <div>
                          <div className="students-list-name">
                            {stu.first_name} {stu.last_name}
                          </div>
                          <div className="students-list-id">ID: {stu.id}</div>
                        </div>
                      </div>
                      <div className="students-list-contact">
                        <a href={`mailto:${stu.email}`}>{stu.email}</a>
                        <div>{stu.phone}</div>
                      </div>
                      <div className="students-list-status">
                        <span
                          className="students-status-badge"
                          style={{
                            background:
                              stu.status === "Active"
                                ? "#22c55e"
                                : stu.status === "Inactive"
                                ? "#f59e42"
                                : stu.status === "Graduated"
                                ? "#6366f1"
                                : stu.status === "Suspended"
                                ? "#e11d48"
                                : "#aaa",
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        >
                          {stu.status}
                        </span>
                      </div>
                      <div className="students-list-updated">
                        <span className="students-list-updated-icon">🕒</span>
                        {stu.updated_at ? new Date(stu.updated_at).toLocaleString() : ""}
                      </div>
                      <div className="students-list-actions">
                        <button
                          className="students-action-btn"
                          title="Edit"
                          onClick={() => handleEdit(stu)}
                          style={{ marginRight: 8 }}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                              fill="#888"
                            />
                          </svg>
                        </button>
                        <button
                          className="students-action-btn"
                          title="Delete"
                          onClick={() => handleDeleteClick(stu)}
                          style={{ color: "#e11d48" }}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6m-6 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"
                              stroke="#e11d48"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ));
                }
                const key = selectedSubDept || selectedDept;
                const list =
                  (studentsByYearDept[selectedYear] &&
                    studentsByYearDept[selectedYear][key]) ||
                  [];
                if (list.length === 0) {
                  return (
                    <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
                      No students found for this folder.
                    </div>
                  );
                }
                return list.map(stu => (
                  <div className="students-list-row" key={stu.id} onClick={handleRowClick(stu)} style={{ cursor: selectionMode ? 'default' : 'pointer' }}>
                    {selectionMode && (
                      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(stu.id)}
                          onChange={(e) => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) next.add(stu.id); else next.delete(stu.id);
                            setSelectedIds(next);
                          }}
                        />
                      </div>
                    )}
                    <div className="students-list-student" onClick={() => !selectionMode && openViewStudent(stu)} style={{ cursor: selectionMode ? 'default' : 'pointer' }}>
                      <img
                        src={stu.photo_url || stu.avatar || "/avatar1.png"}
                        alt={stu.first_name + " " + stu.last_name}
                        className="students-list-avatar"
                      />
                      <div>
                        <div className="students-list-name">
                          {stu.first_name} {stu.last_name}
                        </div>
                        <div className="students-list-id">ID: {stu.id}</div>
                      </div>
                    </div>
                    <div className="students-list-contact">
                      <a href={`mailto:${stu.email}`}>{stu.email}</a>
                      <div>{stu.phone}</div>
                    </div>
                    <div className="students-list-status">
                      <span
                        className="students-status-badge"
                        style={{
                          background:
                            stu.status === "Active"
                              ? "#22c55e"
                              : stu.status === "Inactive"
                              ? "#f59e42"
                              : stu.status === "Graduated"
                              ? "#6366f1"
                              : stu.status === "Suspended"
                              ? "#e11d48"
                              : "#aaa",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {stu.status}
                      </span>
                    </div>
                    <div className="students-list-updated">
                      <span className="students-list-updated-icon">🕒</span>
                      {stu.updated_at ? new Date(stu.updated_at).toLocaleString() : ""}
                    </div>
                    <div className="students-list-actions">
                      <button
                        className="students-action-btn"
                        title="Edit"
                        onClick={() => handleEdit(stu)}
                        style={{ marginRight: 8 }}
                      >
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                            fill="#888"
                          />
                        </svg>
                      </button>
                      <button
                        className="students-action-btn"
                        title="Delete"
                        onClick={() => handleDeleteClick(stu)}
                        style={{ color: "#e11d48" }}
                      >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6m-6 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"
                            stroke="#e11d48"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {viewMode==='folder' && !selectedYear && !showArchived && isSearchActive && (
          <div>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              Search Results
            </div>
            <div className="students-list-table">
              {/* Selection toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 8px 0' }}>
                {!selectionMode ? (
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    style={{
                      background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                      padding: '6px 12px', borderRadius: 8, fontWeight: 700
                    }}
                  >
                    Select
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, userSelect: 'none', cursor: 'pointer' }}>
                      <input type="checkbox" onChange={toggleSelectAll}
                        checked={(() => { const list = getCurrentVisibleList(); return list.length > 0 && list.every(s => selectedIds.has(s.id)); })()}
                      />
                      Select all
                    </label>
                    <button type="button" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
                      style={{ background: '#e5e7eb', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button type="button" onClick={openBulkDelete} disabled={[...selectedIds].length === 0}
                      style={{
                        background: [...selectedIds].length === 0 ? '#fecaca' : '#ef4444', color: '#fff',
                        border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700,
                        cursor: [...selectedIds].length === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Delete Selected ({[...selectedIds].length})
                    </button>
                  </div>
                )}
              </div>
              <div className="students-list-header">
                {selectionMode && <div style={{ width: 28 }}>&nbsp;</div>}
                <div>Student</div>
                <div>Department/Program</div>
                <div>Contact</div>
                <div>Status</div>
                <div>Last Updated</div>
                <div>Actions</div>
              </div>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((stu) => (
                  <div className="students-list-row" key={stu.id} onClick={handleRowClick(stu)} style={{ cursor: selectionMode ? 'default' : 'pointer' }}>
                    {selectionMode && (
                      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(stu.id)}
                          onChange={(e) => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) next.add(stu.id); else next.delete(stu.id);
                            setSelectedIds(next);
                          }}
                        />
                      </div>
                    )}
                    <div className="students-list-student" onClick={() => !selectionMode && openViewStudent(stu)} style={{ cursor: selectionMode ? 'default' : 'pointer' }}>
                        <img
                        src={stu.photo_url || stu.avatar || "/avatar1.png"}
                        alt={stu.first_name + " " + stu.last_name}
                        className="students-list-avatar"
                      />
                      <div>

                        <div className="students-list-name">
                          {stu.first_name} {stu.last_name}
                        </div>
                        <div className="students-list-id">ID: {stu.id}</div>
                      </div>
                    </div>
                    <div className="students-list-contact">
                      <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        {stu.department}
                      </div>
                      {stu.program && stu.program !== stu.department && (
                        <div style={{ fontSize: "0.9rem", color: "#6366f1", fontWeight: 500 }}>
                          {stu.program}
                        </div>
                      )}
                      {stu.academic_year && (
                        <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>
                          SY {stu.academic_year}
                        </div>
                      )}
                    </div>
                    <div className="students-list-contact">
                      <a href={`mailto:${stu.email}`}>{stu.email}</a>
                      <div>{stu.phone}</div>
                    </div>
                    <div className="students-list-status">
                      <span
                        className="students-status-badge"
                        style={{
                          background:
                            stu.status === "Active"
                              ? "#22c55e"
                              : stu.status === "Inactive"
                              ? "#f59e42"
                              : stu.status === "Graduated"
                              ? "#6366f1"
                              : stu.status === "Suspended"
                              ? "#e11d48"
                              : "#aaa",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {stu.status}
                      </span>
                    </div>
                    <div className="students-list-updated">
                      <span className="students-list-updated-icon">🕒</span>
                      {stu.updated_at ? new Date(stu.updated_at).toLocaleString() : ""}
                    </div>
                    <div className="students-list-actions">
                      <button
                        className="students-action-btn"
                        title="Edit"
                        onClick={() => handleEdit(stu)}
                        style={{ marginRight: 8 }}
                      >
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                            fill="#888"
                          />
                        </svg>
                      </button>
                      <button
                        className="students-action-btn"
                        title="Delete"
                        onClick={() => handleDeleteClick(stu)}
                        style={{ color: "#e11d48" }}
                      >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6m-6 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"
                            stroke="#e11d48"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: 32,
                    color: "#888",
                    textAlign: "center",
                  }}
                >
                  No students found.
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode==='table' && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:'1.25rem', fontWeight:700 }}>All Students Table {selectedYear && `• ${selectedYear}`} {selectedDept && `• ${selectedDept}`}</div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                {!selectionMode ? (
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    style={{ background:'#eef2ff', color:'#4f46e5', border:'1px solid #c7d2fe', padding:'6px 12px', borderRadius:8, fontWeight:700 }}
                  >Select</button>
                ) : (
                  <>
                    <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={(() => { const list = getCurrentVisibleList(); return list.length>0 && list.every(s=> selectedIds.has(s.id)); })()}
                      /> Select All
                    </label>
                    <button type="button" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} style={{ background:'#e5e7eb', border:'none', padding:'6px 12px', borderRadius:8, fontWeight:700 }}>Cancel</button>
                    <button type="button" onClick={openBulkDelete} disabled={[...selectedIds].length===0} style={{ background:[...selectedIds].length===0?'#fecaca':'#ef4444', color:'#fff', border:'none', padding:'6px 12px', borderRadius:8, fontWeight:700, cursor:[...selectedIds].length===0?'not-allowed':'pointer' }}>Delete Selected ({[...selectedIds].length})</button>
                  </>
                )}
              </div>
            </div>
            <div className="students-list-table">
              <div className="students-list-header" style={{ gridTemplateColumns: selectionMode ? '28px 1.4fr 1fr 1fr .9fr .9fr .8fr 140px' : '1.4fr 1fr 1fr .9fr .9fr .8fr 140px' }}>
                {selectionMode && <div />}
                <div style={{ cursor:'pointer' }} onClick={()=> toggleSortField('name')}>Name {tableSort.field==='name' && (tableSort.direction==='asc'?'▲':'▼')}</div>
                <div style={{ cursor:'pointer' }} onClick={()=> toggleSortField('department')}>Department {tableSort.field==='department' && (tableSort.direction==='asc'?'▲':'▼')}</div>
                <div style={{ cursor:'pointer' }} onClick={()=> toggleSortField('program')}>Program {tableSort.field==='program' && (tableSort.direction==='asc'?'▲':'▼')}</div>
                <div style={{ cursor:'pointer' }} onClick={()=> toggleSortField('academic_year')}>School Year {tableSort.field==='academic_year' && (tableSort.direction==='asc'?'▲':'▼')}</div>
                <div style={{ cursor:'pointer' }} onClick={()=> toggleSortField('status')}>Status {tableSort.field==='status' && (tableSort.direction==='asc'?'▲':'▼')}</div>
                <div style={{ cursor:'pointer' }} onClick={()=> toggleSortField('updated_at')}>Updated {tableSort.field==='updated_at' && (tableSort.direction==='asc'?'▲':'▼')}</div>
                <div>Actions</div>
              </div>
              {groupedSortedRows.length === 0 && (
                <div style={{ padding:32, textAlign:'center', color:'#888' }}>No students found.</div>
              )}
              {groupedSortedRows.map((item, idx) => {
                if (item.type === 'group') {
                  return (
                    <div key={`g-${item.key}-${idx}`} style={{ background:'#f1f5f9', padding:'8px 16px', fontWeight:600, fontSize:'.9rem', borderLeft:'4px solid #6366f1', marginTop: idx===0?0:12, borderRadius:6 }}>
                      {item.key}
                    </div>
                  );
                }
                const stu = item.stu;
                return (
                  <div key={stu.id} className="students-list-row" style={{ cursor: selectionMode? 'default':'pointer' }} onClick={handleRowClick(stu)}>
                    {selectionMode && (
                      <div style={{ display:'flex', alignItems:'center', paddingLeft:8 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(stu.id)}
                          onChange={(e) => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) next.add(stu.id); else next.delete(stu.id);
                            setSelectedIds(next);
                          }}
                        />
                      </div>
                    )}
                    <div className="students-list-student" style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <img src={stu.photo_url || stu.avatar || '/avatar1.png'} alt={stu.first_name+' '+stu.last_name} className="students-list-avatar" />
                      <div>
                        <div className="students-list-name">{stu.first_name} {stu.last_name}</div>
                        <div className="students-list-id">ID: {stu.id}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight:600 }}>{stu.department || '—'}</div>
                    <div style={{ fontSize:'.85rem', color:'#4f46e5', fontWeight:500 }}>{stu.program && stu.program!==stu.department ? stu.program : '—'}</div>
                    <div style={{ fontSize:'.85rem', color:'#374151' }}>{normalizeYearLabel(stu.academic_year) || '—'}</div>
                    <div>
                      <span className="students-status-badge" style={{
                        background: stu.status==='Active'? '#22c55e' : stu.status==='Inactive'? '#f59e42' : stu.status==='Graduated'? '#6366f1' : stu.status==='Suspended'? '#e11d48' : '#aaa',
                        color:'#fff', fontWeight:600 }}>
                        {stu.status || '—'}
                      </span>
                    </div>
                    <div style={{ fontSize:'.75rem', display:'flex', alignItems:'center', gap:4 }}>
                      <span className="students-list-updated-icon">🕒</span>{stu.updated_at ? new Date(stu.updated_at).toLocaleString() : ''}
                    </div>
                    <div className="students-list-actions">
                      <button className="students-action-btn" title="Edit" onClick={() => handleEdit(stu)} style={{ marginRight:8 }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#888"/></svg>
                      </button>
                      <button className="students-action-btn" title="Delete" onClick={() => handleDeleteClick(stu)} style={{ color:'#e11d48' }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6m-6 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="students-modal-bg" onClick={closeAddStudentModal}>
          <div
            className="students-modal"
            style={{
              maxWidth: "1100px",
              width: "90vw",
              minWidth: "700px",
              margin: "40px auto",
              padding: "40px 48px",
              borderRadius: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="students-modal-title">Add Student</div>
            <form
              className="students-modal-form"
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "32px 40px",
                alignItems: "center",
              }}
            >
              <div className="students-modal-row" style={{ gridColumn: "1 / span 2" }}>
                <label>Profile Photo</label>
                <div className="students-avatar-upload">
                  <div className="students-avatar-preview">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Selected student preview" />
                    ) : (
                      <span className="students-avatar-placeholder">No image selected</span>
                    )}
                  </div>
                  <div className="students-avatar-actions">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} />
                    {photoPreview && (
                      <button
                        type="button"
                        className="students-avatar-clear"
                        onClick={clearAddPhoto}
                      >
                        Remove Photo
                      </button>
                    )}
                    <p className="students-avatar-hint">PNG or JPG up to 2MB.</p>
                  </div>
                </div>
              </div>
              <div className="students-modal-row">
                <label>
                  School Year <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <select
                  name="academic_year"
                  value={form.academic_year}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select School Year</option>
                  {allYearFolders.map((year) => {
                    const status = getAyStatus(year);
                    const isActive = String(status).toLowerCase() === 'active';
                    const keyVal = year.replace(/^SY\s*/, "");
                    return (
                      <option
                        key={year}
                        value={keyVal}
                        disabled={!isActive}
                      >
                        {year}{!isActive ? ` (${status})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="students-modal-row">
                <label>
                  Department <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={e => {
                    const dept = e.target.value;
                    setForm({ ...form, department: dept, program: "" });
                    courseModalWasShownRef.current = false;
                    if (dept) {
                      const deptLower = dept.trim().toLowerCase();
                      const matches = coursesData.filter(c =>
                        ((c.department || c.program || "").trim().toLowerCase()) === deptLower
                      );
                      if (matches.length > 0) {
                        setPendingDeptCourses(matches);
                        setShowCourseSelectModal(true);
                        courseModalWasShownRef.current = true;
                      }
                    }
                  }}
                  required
                >
                  <option value="">Select Department</option>
                  {departmentsData.map((dept) => {
                    const isArchived = ((dept.status || "").toLowerCase() === "archived");
                    return (
                      <option key={dept.id} value={dept.name} disabled={isArchived}>
                        {dept.name}{isArchived ? " (Archived)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              {departmentSubfolders[form.department] && (
                <div className="students-modal-row">
                  <label>
                    Program <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <select
                    name="program"
                    value={form.program}
                    onChange={e => setForm({ ...form, program: e.target.value })}
                    required
                  >
                    <option value="">Select Program</option>
                    {departmentSubfolders[form.department].map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {(availablePrograms.length > 0 || form.program) &&
                !departmentSubfolders[form.department] && (
                <div className="students-modal-row">
                  <label>
                    Program <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <select
                    name="program"
                    value={form.program}
                    onChange={e => setForm({ ...form, program: e.target.value })}
                    required
                  >
                    <option value="">Select Program</option>
                    {availablePrograms.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                    {form.program &&
                      !availablePrograms.includes(form.program) && (
                        <option value={form.program}>{form.program}</option>
                      )}
                  </select>
                </div>
              )}
              <div className="students-modal-row">
                <label>
                  First Name <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="students-modal-row">
                <label>
                  Last Name <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="students-modal-row">
                <label>
                  Gender <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="students-modal-row">
                <label>Birthdate</label>
                <input
                  type="date"
                  name="birthdate"
                  value={form.birthdate}
                  onChange={handleChange}
                />
              </div>
              <div className="students-modal-row">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="students-modal-row">
                <label>
                  Status <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="students-modal-row">
                <label>
                  Email <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ gridColumn: "1 / span 2", display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <button
                  type="button"
                  className="students-modal-cancel"
                  onClick={closeAddStudentModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="students-modal-submit"
                  disabled={loading}
                  style={{
                    marginLeft: 16,
                    background: "linear-gradient(90deg,#0f9d58,#3f51b5)",
                    color: "#fff",
                    fontWeight: 600,
                    borderRadius: 16,
                    padding: "8px 32px",
                    boxShadow: "2px 2px 8px #0001",
                  }}
                >
                  {loading ? "Adding..." : "Add Student"}
                </button>
              </div>
              {error && (
                <div style={{ color: "#e11d48", marginTop: 8, gridColumn: "1 / span 2" }}>{error}</div>
              )}
              {message && (
                <div style={{ color: "#22c55e", marginTop: 8, gridColumn: "1 / span 2" }}>{message}</div>
              )}
            </form>
          </div>
        </div>
      )}

      {viewModalOpen && viewStudent && (
        <div
          className="students-modal-bg"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2600 }}
          onClick={closeViewStudent}
        >
          <div
            className="students-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', width: '100%', maxWidth: 640, padding: '28px 32px', borderRadius: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Student Details</h3>
              <button onClick={closeViewStudent} style={{ background: '#e5e7eb', border: 'none', padding: '6px 10px', borderRadius: 8, fontWeight: 700 }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <img
                src={viewStudent.photo_url || viewStudent.avatar || '/avatar1.png'}
                alt={viewStudent.first_name + ' ' + viewStudent.last_name}
                style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', cursor: (viewStudent.photo_url || viewStudent.avatar) ? 'zoom-in' : 'default' }}
                onClick={() => {
                  const full = viewStudent.photo_url || viewStudent.avatar;
                  if (!full) return;
                  setPhotoPreviewSrcFull(full);
                  setPhotoPreviewOpen(true);
                }}
              />
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{viewStudent.first_name} {viewStudent.last_name}</div>
                <div style={{ color: '#6b7280' }}>ID: {viewStudent.id}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Email</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.email || '—'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Phone</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.phone || '—'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Gender</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.gender || '—'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Birthdate</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.birthdate ? new Date(viewStudent.birthdate).toLocaleDateString() : '—'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Academic Year</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{normalizeYearLabel(viewStudent.academic_year) || '—'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.status || '—'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Department</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.department || '—'}</div>
              </div>
              {viewStudent.program ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Program</label>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.program}</div>
                </div>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Last Updated</label>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', minHeight: 40 }}>{viewStudent.updated_at ? new Date(viewStudent.updated_at).toLocaleString() : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {photoPreviewOpen && photoPreviewSrcFull && (
        <div
          className="students-modal-bg"
          onClick={() => setPhotoPreviewOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={photoPreviewSrcFull}
              alt={viewStudent?.first_name + ' ' + viewStudent?.last_name + ' full photo'}
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}
            />
            <button
              onClick={() => setPhotoPreviewOpen(false)}
              style={{ position: 'absolute', top: 8, right: 8, background: '#111827', color: '#fff', border: 'none', padding: '8px 14px', fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
            >Close</button>
          </div>
        </div>
      )}
      {editModal && (
        <div className="students-modal-bg" onClick={closeEditStudentModal}>
          <div
            className="students-modal"
            style={{
              maxWidth: "1100px",
              width: "90vw",
              minWidth: "700px",
              margin: "40px auto",
              padding: "40px 48px",
              borderRadius: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "green", marginBottom: 0 }}>Edit Student</h2>
            <div style={{ marginBottom: 16, color: "#444" }}>
              Update student information in FSUU system
            </div>
            <form
              onSubmit={handleEditSubmit}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "32px 40px",
                alignItems: "center",
              }}
            >
              <div className="students-modal-row" style={{ gridColumn: "1 / span 2" }}>
                <label>Profile Photo</label>
                <div className="students-avatar-upload">
                  <div className="students-avatar-preview">
                    {editPhotoPreview ? (
                      <img src={editPhotoPreview} alt="Selected student preview" />
                    ) : (
                      <span className="students-avatar-placeholder">No image selected</span>
                    )}
                  </div>
                  <div className="students-avatar-actions">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoChange}
                      disabled={editLoading}
                    />
                    {editPhotoPreview && (
                      <button
                        type="button"
                        className="students-avatar-clear"
                        onClick={clearEditPhoto}
                        disabled={editLoading}
                      >
                        Remove Photo
                      </button>
                    )}
                    <p className="students-avatar-hint">PNG or JPG up to 2MB.</p>
                  </div>
                </div>
              </div>
              {Object.entries(initialState).map(([key, _]) => (
                <div className="students-modal-row" key={key} style={{ width: "100%" }}>
                  <label style={{ fontWeight: 500 }}>
                    {key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  {key === "gender" ? (
                    <select
                      name={key}
                      value={editForm[key] || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  ) : key === "department" ? (
                    <select
                      name={key}
                      value={editForm[key] || ""}
                      onChange={(e) => {
                        setEditForm({ ...editForm, department: e.target.value, program: "" });
                      }}
                      required
                    >
                      <option value="">Select Department</option>
                      {departmentsData.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : key === "program" ? (
                    <select
                      name={key}
                      value={editForm[key] || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      required={!!departmentSubfolders[editForm.department]}
                      disabled={!departmentSubfolders[editForm.department]}
                    >
                      <option value="">Select Program</option>
                      {departmentSubfolders[editForm.department] &&
                        departmentSubfolders[editForm.department].map((prog) => (
                          <option key={prog} value={prog}>
                            {prog}
                          </option>
                        ))}
                    </select>
                  ) : key === "status" ? (
                    <select
                      name={key}
                      value={editForm[key] || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  ) : key === "academic_year" ? (
                    <select
                      name={key}
                      value={editForm[key] || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      required
                    >
                      <option value="">Select School Year</option>
                      {allYearFolders.map((year) => (
                        <option
                          key={year}
                          value={year.replace(/^SY\s*/, "")}
                        >
                          {year}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        key === "birthdate"
                          ? "date"
                          : key === "email"
                          ? "email"
                          : "text"
                      }
                      name={key}
                      value={editForm[key] || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      required={key !== "phone"}
                    />
                  )}
                </div>
              ))}
              <div style={{ gridColumn: "1 / span 2", display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <button
                  type="button"
                  className="students-modal-cancel"
                  onClick={closeEditStudentModal}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="students-modal-submit"
                  style={{
                    marginLeft: 16,
                    background: "linear-gradient(90deg,#0f9d58,#3f51b5)",
                    color: "#fff",
                    fontWeight: 600,
                    borderRadius: 16,
                    padding: "8px 32px",
                    boxShadow: "2px 2px 8px #0001",
                  }}
                  disabled={editLoading}
                >
                  {editLoading ? "Updating..." : "Update Student"}
                </button>
              </div>
              {error && (
                <div style={{ color: "#e11d48", marginTop: 8, gridColumn: "1 / span 2" }}>{error}</div>
              )}
            </form>
          </div>
        </div>
      )}

      {showAddYearModal && (
        <div className="students-modal-bg" onClick={() => setShowAddYearModal(false)}>
          <div className="students-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Add School Year Folder</h3>
                                             <form onSubmit={handleAddYear}>
              <div style={{ marginBottom: 16 }}>
                <label>School Year (e.g. 2025-2026):</label>
                <input
                  type="text"
                  pattern="\d{4}-\d{4}"
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    marginTop:  6,
                  }}
                  placeholder="2025-2026"
                  required
                />
              </div>
              {addYearError && (
                <div style={{ color: "#e11d48", marginBottom: 8 }}>{addYearError}</div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  style={{
                    background: "#eee",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 20px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 20px",
                    fontWeight: 600,
                  }}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCourseSelectModal && (
        <div className="students-modal-bg" onClick={() => setShowCourseSelectModal(false)}>
          <div
            className="students-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 520,
              width: "90%",
              padding: "32px 36px",
              borderRadius: 24
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Select Course / Program</h3>
            <div style={{ color: "#555", marginBottom: 20 }}>
              Courses available in: <b>{form.department}</b>
            </div>
            {pendingDeptCourses.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#888" }}>
                No courses found for this department.
              </div>
            )}
            <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 24 }}>
              {pendingDeptCourses.map(course => {
                const courseName = (course.name || course.program || "Untitled").trim();
                const isArchived = ((course.status || "").toLowerCase() === "archived");
                return (
                  <div
                    key={course.id || courseName}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      marginBottom: 12,
                      cursor: isArchived ? "not-allowed" : "pointer",
                      background: form.program === courseName ? "#eef2ff" : "#fff",
                      transition: "background .15s"
                    }}
                    onClick={() => {
                      if (isArchived) return;
                      setForm(f => ({ ...f, program: courseName }));
                      setShowCourseSelectModal(false);
                    }}
                  >
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      {courseName}
                      {isArchived && (
                        <span style={{
                          fontSize: 12,
                          background: "#e5e7eb",
                          color: "#6b7280",
                          borderRadius: 6,
                          padding: "2px 6px",
                          fontWeight: 700
                        }}>Archived</span>
                      )}
                    </div>
                    <button
                      type="button"
                      style={{
                        border: "none",
                        background: isArchived ? "#cbd5e1" : "#6366f1",
                        color: isArchived ? "#475569" : "#fff",
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: ".8rem"
                      }}
                      disabled={isArchived}
                    >
                      Choose
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setShowCourseSelectModal(false);
                }}
                style={{
                  background: "#eee",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!form.program}
                onClick={() => setShowCourseSelectModal(false)}
                style={{
                  background: form.program ? "#6366f1" : "#a5b4fc",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontWeight: 600,
                  cursor: form.program ? "pointer" : "not-allowed"
                }}
              >
                Done
              </button>
            </div>
            {!form.program && (
              <div style={{ marginTop: 12, fontSize: ".8rem", color: "#666" }}>
                Pick a course or close to choose later.
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="students-modal-bg"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2600 }}
          onClick={() => !deleteInProgress && setShowDeleteConfirm(false)}
        >
          <div className="students-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, padding: '28px 32px', borderRadius: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Delete {deleteTargets.length > 1 ? `${deleteTargets.length} Students` : 'Student'}</h3>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, marginBottom: 16 }}>
              This action is permanent. {deleteTargets.length === 1 ? (
                <>
                  Are you sure you want to delete <b>{deleteTargets[0]?.first_name} {deleteTargets[0]?.last_name}</b>?
                </>
              ) : (
                <>
                  Are you sure you want to delete these {deleteTargets.length} students?
                </>
              )}
              <br />
              Type <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>Delete</code> to confirm.
            </div>
            <input
              autoFocus
              type="text"
              placeholder='Type "Delete" to confirm'
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={deleteInProgress}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleteInProgress}
                style={{ background: '#e5e7eb', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 700 }}
              >
                Cancel
              </button>
              <button type="button" onClick={confirmDeleteStudents}
                disabled={deleteConfirmText !== 'Delete' || deleteInProgress}
                style={{ background: deleteConfirmText === 'Delete' && !deleteInProgress ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 10, fontWeight: 700, cursor: deleteConfirmText === 'Delete' && !deleteInProgress ? 'pointer' : 'not-allowed' }}
              >
                {deleteInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;