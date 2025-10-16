import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "../axios";
import "../../sass/Faculty.scss";
import notifications from '../utils/notifications';
import '../utils/activityBus';

const initialState = {
  first_name: "",
  last_name: "",
  email: "",
  gender: "",
  birthdate: "",
  phone: "",
  course_id: "",
  department: "",
  academic_year: "",
  status: "",
  program: "",
  dean_department: "",
  assigned_program: "",
};

const departmentOptions = [
  "Major Leadership / Administrative Positions",
  "Academic / Teaching Positions",
  "Support, Non-Academic / Administrative Roles",
  "Student Assistant Position",
];

const yearFolders = [
  "SY 2020-2021",
  "SY 2021-2022",
  "SY 2022-2023",
  "SY 2023-2024",
  "SY 2024-2025",
];

const departmentSubfolders = {
  "Major Leadership / Administrative Positions": [
    "University President",
    "Vice President for Academic Affairs and Research",
    "Vice President for Administration and Student Affairs",
    "Deans",
    "Assistant Principal",
    "Director",
    "Secretary to the President",
  ],
  "Academic / Teaching Positions": [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Instructors",
    "Supervising Instructors",
    "Teachers",
    "Chairperson",
    "Program Chair",
  ],
  "Support, Non-Academic / Administrative Roles": [
    "Registrar",
    "Guidance Counselor / Director of Guidance Center",
    "Property & Maintenance Director / Officer",
    "Quality Assurance / Strategic Planning Office",
    "Information Technology / Systems Department Director",
  ],
  "Student Assistant Position": [
    "Student Assistant",
  ],
};

const deanDepartments = [
  "Arts and Sciences",
  "Accountancy",
  "Business Administration",
  "Criminal Justice Education",
  "Computer Studies",
  "Engineering Technology",
  "Law",
  "Nursing",
  "Teacher Education",
];

const FACULTY_BANNER_IMG = "/images/Faculty_Manager.png";

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="students-modal-bg" style={{ zIndex: 1000 }}>
      <div className="students-modal" style={{ maxWidth: 400, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <p style={{ marginBottom: 24 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            style={{
              background: "#e11d48",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontWeight: 600,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const Faculty = () => {
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState([]);
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
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [customYears, setCustomYears] = useState(() => {
    const saved = localStorage.getItem("customYears");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYearStart, setNewYearStart] = useState("");
  const [yearMenuOpen, setYearMenuOpen] = useState(null);
  const yearMenuRef = useRef(null);
  const [archivedYears, setArchivedYears] = useState(() => {
    const saved = localStorage.getItem("archivedYears");
    return saved ? JSON.parse(saved) : [];
  });
  const [restoredYearLabel, setRestoredYearLabel] = useState("");
  const [addYearError, setAddYearError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsError, setDepartmentsError] = useState("");
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, message: "", label: "" });

  // NEW: archive/restore modal states (same as Students.js)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveTargetYear, setArchiveTargetYear] = useState(null);
  const [archiveConfirmText, setArchiveConfirmText] = useState("");
  const [archiveInProgress, setArchiveInProgress] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreTargetYear, setRestoreTargetYear] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  const allYearFolders = [...yearFolders, ...customYears];

  useEffect(() => {
    localStorage.setItem("customYears", JSON.stringify(customYears));
  }, [customYears]);

  useEffect(() => {
    localStorage.setItem("archivedYears", JSON.stringify(archivedYears));
  }, [archivedYears]);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await axios.get("/api/faculty");
        setFaculty(res.data.faculty || []);
      } catch (err) {
        setError("Failed to fetch faculty.");
      }
    };
    fetchFaculty();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("/api/departments");
        setDepartments(res.data.departments || []);
        setDepartmentsError("");
      } catch (err) {
        setDepartmentsError("Failed to load programs list.");
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.academic_year) {
      setError("Please select a School Year.");
      return;
    }
    if (!form.department) {
      setError("Please select a Department.");
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
    if (form.department === "Academic / Teaching Positions") {
      if (!form.program) {
        setError("Please select a Program/Position for Teaching Positions.");
        return;
      }
      if (!form.assigned_program) {
        setError("Please select an Assigned Academic Program.");
        return;
      }
    }
    const submitData = { ...form };
    if (submitData.academic_year.startsWith("SY ")) {
      submitData.academic_year = submitData.academic_year.replace(/^SY\s*/, "");
    }
    if (submitData.program === 'Deans') {
      if (submitData.dean_department) {
        submitData.program = submitData.dean_department;
      } else {
        setLoading(false);
        setError('Please select a Dean Department.');
        return;
      }
    } else if (!departmentSubfolders[form.department]) {
      delete submitData.program;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/faculty", submitData);
      const serverItem = res?.data?.faculty;
      const created = serverItem ? { ...submitData, ...serverItem } : submitData;
      setFaculty((prev) => ([...(prev || []), created]));
      setMessage("Faculty added successfully!");
      setShowModal(false);
      setForm(initialState);
      notifications.add(`Faculty member ${created.first_name} ${created.last_name} has been added successfully!`);
      window.dispatchEvent(new CustomEvent('facultyAdded', {
        detail: created,
        bubbles: true
      }));
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        setError(
          Object.values(errors)
            .map((arr) => arr.join(" "))
            .join(" ")
        );
      } else {
        setError(
          err.response?.data?.message ||
          "Failed to add faculty."
        );
      }
    }
    setLoading(false);
  };

  const handleEdit = (member) => {
    const filledMember = { ...initialState, ...member };
    let department = filledMember.department;
    let program = filledMember.program;
    let foundDept = null;
    Object.entries(departmentSubfolders).forEach(([dept, programs]) => {
      if (programs.includes(filledMember.department)) {
        foundDept = dept;
        program = filledMember.department;
      }
      if (programs.includes(filledMember.program)) {
        foundDept = dept;
        program = filledMember.program;
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
    const deptNames = (departments || []).map(d => (d?.name ?? '').toLowerCase());
    let dean_department_val = "";
    if (deptNames.includes((program || '').toLowerCase())) {
      dean_department_val = program;
      program = 'Deans';
      department = 'Major Leadership / Administrative Positions';
    }
    setEditForm({
      ...filledMember,
      department: department || "",
      program: program || "",
      dean_department: dean_department_val,
      assigned_program: filledMember.assigned_program || "",
    });
    setEditId(filledMember.id);
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError("");
    try {
      const payload = { ...editForm };
      if (payload.program === 'Deans') {
        if (payload.dean_department) {
          payload.program = payload.dean_department;
        } else {
          setError('Please select a Dean Department.');
          setEditLoading(false);
          return;
        }
      }
      if (payload.department === "Academic / Teaching Positions") {
        if (!payload.program) {
          setError("Please select a Program/Position for Teaching Positions.");
          setEditLoading(false);
          return;
        }
        if (!payload.assigned_program) {
          setError("Please select an Assigned Academic Program.");
          setEditLoading(false);
          return;
        }
      }
      await axios.put(`/api/faculty/${editId}`, payload);
      const refreshed = await axios.get("/api/faculty");
      setFaculty(refreshed.data.faculty || []);
      setEditModal(false);
      notifications.edit(`Faculty member ${payload.first_name} ${payload.last_name} has been updated successfully!`);
      window.dispatchEvent(new CustomEvent('facultyUpdated', {
        detail: {...payload, id: editId},
        bubbles: true
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Failed to update faculty.")
      );
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
    if (!archivedYears.includes(label)) {
      notifications.delete(`School Year folder ${label} deleted successfully!`);
    }
    setCustomYears((prev) => prev.filter((y) => y !== label));
    setYearMenuOpen(null);
    setConfirmModal({ show: false, action: null, message: "", label: "" });
  };

  // REFACTORED: archive helpers to match Students.js behavior
  const archiveYear = (year) => {
    setArchivedYears(prev => {
      if (prev.includes(year)) return prev;
      const updated = [...prev, year];
      try { localStorage.setItem("archivedYears", JSON.stringify(updated)); } catch (_) {}
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
    const label = archiveTargetYear; // capture before closing/reset
    try {
      archiveYear(label);
      // Log to Recent Activities
      window.dispatchEvent(new CustomEvent('facultyYearArchived', {
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
      setArchivedYears(prev => prev.filter(y => y !== label));
      setRestoredYearLabel(label);
      notifications.edit(`School Year folder ${label} has been restored from the archives!`);
      // Log to Recent Activities
      window.dispatchEvent(new CustomEvent('facultyYearRestored', {
        detail: { label },
        bubbles: true
      }));
    } finally {
      setRestoreInProgress(false);
      setShowRestoreConfirm(false);
      setRestoreTargetYear(null);
    }
  };

  const openConfirmModal = (action, label) => {
    let message = "";
    if (action === "archive") {
      message = `Are you sure you want to archive the folder "${label}"?`;
    } else if (action === "restore") {
      message = `Are you sure you want to restore the folder "${label}" from the archives?`;
    } else if (action === "delete") {
      message = `Are you sure you want to permanently delete the folder "${label}"? This cannot be undone.`;
    }
    setConfirmModal({ show: true, action, message, label });
  };

  const confirmAction = () => {
    if (confirmModal.action === "delete") {
      handleDeleteYear(confirmModal.label);
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

  const filteredFaculty = faculty.filter(mem => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (mem.first_name && mem.first_name.toLowerCase().includes(query)) ||
      (mem.last_name && mem.last_name.toLowerCase().includes(query)) ||
      (mem.id && String(mem.id).includes(query)) ||
      (mem.email && mem.email.toLowerCase().includes(query)) ||
      (mem.department && mem.department.toLowerCase().includes(query)) ||
      (mem.program && mem.program.toLowerCase().includes(query)) ||
      (mem.assigned_program && mem.assigned_program.toLowerCase().includes(query))
    );
  });

  const isSearchActive = search.trim().length > 0;

  const facultyByYearDept = {};
  (faculty || []).forEach((mem) => {
    let yearFolder = "";
    let rawYear = (mem.academic_year || "").replace(/^SY\s*/, "");
    if (/^\d{4}-\d{4}$/.test(rawYear)) {
      yearFolder = `SY ${rawYear}`;
    } else if (/^\d{4}$/.test(rawYear)) {
      const start = Number(rawYear);
      yearFolder = `SY ${start}-${start + 1}`;
    }
    if (!allYearFolders.includes(yearFolder)) return;
    const groupKey = mem.program && mem.program !== "" ? mem.program : mem.department;
    if (!facultyByYearDept[yearFolder]) {
      facultyByYearDept[yearFolder] = {};
    }
    if (!facultyByYearDept[yearFolder][groupKey]) {
      facultyByYearDept[yearFolder][groupKey] = [];
    }
    facultyByYearDept[yearFolder][groupKey].push(mem);
  });

  const visibleYearFolders = allYearFolders.filter(
    (label) => !archivedYears.includes(label)
  );

  const handleDeleteClick = async (mem) => {
    const input = window.prompt(
      `Type CONFIRM to permanently delete the faculty "${mem.first_name} ${mem.last_name}". This cannot be undone.`
    );
    if (input && input.trim().toLowerCase() === "confirm") {
      try {
        await axios.delete(`/api/faculty/${mem.id}`);
        setFaculty(faculty.filter(s => s.id !== mem.id));
        notifications.delete(`Faculty member ${mem.first_name} ${mem.last_name} has been deleted!`);
        window.dispatchEvent(new CustomEvent('facultyDeleted', {
          detail: mem,
          bubbles: true
        }));
      } catch (err) {
        notifications.info("Failed to delete faculty.");
      }
    }
  };

  useEffect(() => {
    if (showArchived) {
      setSelectedYear(null);
      setSelectedDept(null);
      setSelectedSubDept(null);
    }
  }, [showArchived]);

  const getFacultyCountForYear = (label) => {
    if (facultyByYearDept[label]) {
      return Object.values(facultyByYearDept[label]).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
    }
    return 0;
  };

  const norm = (v) => (v ?? "").toString().trim().toLowerCase();

  const activePrograms = useMemo(
    () =>
      (departments || [])
        .filter(d => norm(d.status) === "active")
        .map(d => d.name),
    [departments]
  );

  const toYearLabel = (raw) => {
    const y = (raw || "").replace(/^SY\s*/, "");
    if (/^\d{4}-\d{4}$/.test(y)) return `SY ${y}`;
    if (/^\d{4}$/.test(y)) return `SY ${Number(y)}-${Number(y) + 1}`;
    return "";
  };

  const countByPositionProgram = (yearLabel, position, program) => {
    return (faculty || []).filter(mem =>
      toYearLabel(mem.academic_year) === yearLabel &&
      norm(mem.program) === norm(position) &&
      norm(mem.assigned_program) === norm(program)
    ).length;
  };

  const countDeansByProgram = (yearLabel, programName) => {
    return (faculty || []).filter(mem =>
      toYearLabel(mem.academic_year) === yearLabel &&
      norm(mem.department) === norm('Major Leadership / Administrative Positions') &&
      (norm(mem.program) === norm(programName) || norm(mem.dean_department) === norm(programName))
    ).length;
  };

  const currentFacultyList = useMemo(() => {
       if (!selectedYear) return [];
       if (selectedDept === "Academic / Teaching Positions" && selectedSubDept && selectedProgram) {
          return (faculty || []).filter(mem =>
               toYearLabel(mem.academic_year) === selectedYear &&
               norm(mem.program) === norm(selectedSubDept) &&
               norm(mem.assigned_program) === norm(selectedProgram)
           );
       }
       if (selectedDept === "Major Leadership / Administrative Positions" && selectedSubDept === "Deans" && selectedProgram) {
          return (faculty || []).filter(mem =>
              toYearLabel(mem.academic_year) === selectedYear &&
              norm(mem.department) === norm('Major Leadership / Administrative Positions') &&
              (norm(mem.program) === norm(selectedProgram) || norm(mem.dean_department) === norm(selectedProgram))
          );
       }
       return (facultyByYearDept[selectedYear] &&
           facultyByYearDept[selectedYear][selectedSubDept || selectedDept]) || [];
  }, [selectedYear, selectedDept, selectedSubDept, selectedProgram, faculty, facultyByYearDept]);

  return (
    <div className="students-root">
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
              flexShrink: 0
            }}
          >
            <img
              src={FACULTY_BANNER_IMG}
              alt="Faculty Management"
              style={{ width: "70%", height: "70%", objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.parentElement.style.display = "none";
              }}
            />
          </div>
          <div style={{ minWidth: 200 }}>
            <div className="students-banner-title" style={{ marginBottom: 4 }}>
              Faculty Management
            </div>
            <div className="students-banner-sub" style={{ lineHeight: 1.25 }}>
              FSUU - Manage faculty records and academic information
            </div>
          </div>
        </div>

        <div className="students-banner-actions">
          <button
            className="students-banner-add"
            style={{
              background: "linear-gradient(90deg,#6366f1,#7c3aed)",
              color: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "8px 28px",
              fontWeight: 600,
              marginRight: 16,
              fontSize: "1rem",
              boxShadow: "0 2px 8px #0001",
              transition: "box-shadow 0.2s",
            }}
            onClick={() => setShowAddYearModal(true)}
          >
            + Add SY Folder
          </button>
          <button
            className="students-banner-archived"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
          <button
            className="students-banner-add"
            onClick={() => setShowModal(true)}
          >
            + Add Faculty
          </button>
        </div>
      </div>
      
      <div
        style={{
          margin: "32px 0 0 0",
          display: "flex",
          alignItems: "center",
          gap: 24,
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
          placeholder="Search faculty by name, email, ID, or department..."
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
            onChange={e => {
              setSelectedDept(e.target.value || null);
              setSelectedSubDept(null);
              setSelectedProgram(null);
            }}
          >
            <option value="">All Departments</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="students-list-card">
        {!selectedYear && !showArchived && !isSearchActive && (
          <div className="students-folders-container">
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {visibleYearFolders.map((label) => {
                const total = getFacultyCountForYear(label);
                return (
                  <div key={label} className="students-folder">
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
                      {label}
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
                            onClick={() => openConfirmModal("delete", label)}
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

        {!selectedYear && showArchived && (
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

        {selectedYear && !selectedDept && (
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
                padding: "0",
                marginTop: "16px",
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
                <span>Job Classifications</span>
                <span>Number of Faculty</span>
              </div>
              {departmentOptions.map((dept) => (
                <div
                  key={dept}
                  className="students-folder"
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    padding: "14px 20px",
                    margin: "12px 16px",
                    borderRadius: 12,
                    background: (selectedDept === dept) ? '#f8fafc' : '#fff',
                    boxShadow: '0 6px 18px rgba(15,23,42,0.04)',
                    borderLeft: (selectedDept === dept) ? '6px solid #6366f1' : '6px solid transparent',
                    fontWeight: 600,
                    fontSize: "1.02rem",
                    transition: "background 0.12s, transform 0.08s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="#6366f1"
                      style={{ marginRight: 14 }}
                    >
                      <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                    </svg>
                    <div style={{ color: '#0f172a' }}>{dept}</div>
                  </div>
                  <span
                    style={{
                      color: "#6366f1",
                      background: "#eef2ff",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                    }}
                  >
                    {
                      departmentSubfolders[dept]
                          ? departmentSubfolders[dept].reduce((sum, prog) => {
                                if (prog === 'Deans') {
                                  const deansTotal = activePrograms.reduce(
                                      (s, p) => s + countDeansByProgram(selectedYear, p),
                                      0
                                  );
                                  return sum + deansTotal;
                                }
                                const v = (facultyByYearDept[selectedYear] &&
                                    facultyByYearDept[selectedYear][prog])
                                    ? facultyByYearDept[selectedYear][prog].length
                                    : 0;
                                return sum + v;
                          }, 0)
                          : (facultyByYearDept[selectedYear] &&
                                  facultyByYearDept[selectedYear][dept])
                          ? facultyByYearDept[selectedYear][dept].length
                          : 0
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedYear && departmentSubfolders[selectedDept] && !selectedSubDept && (
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
                {selectedDept} <span style={{ fontWeight: 400, color: "#888" }}>({selectedYear})</span>
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
                onClick={() => setSelectedDept(null)}
              >
                Back
              </button>
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px #0001",
                padding: "0",
                marginTop: "16px",
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
                <span>Position</span>
                <span>Number of Faculty</span>
              </div>
              {departmentSubfolders[selectedDept].map((sub) => {
                const count = sub === 'Deans'
                  ? activePrograms.reduce((sum, p) => sum + countDeansByProgram(selectedYear, p), 0)
                  : ((facultyByYearDept[selectedYear] && facultyByYearDept[selectedYear][sub])
                    ? facultyByYearDept[selectedYear][sub].length
                    : 0);
                return (
                  <div
                    key={sub}
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
                      fontSize: "1.08rem",
                      transition: "background 0.2s",
                    }}
                    onClick={() => setSelectedSubDept(sub)}
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
                      {sub}
                    </div>
                    <span
                      style={{
                        color: "#6366f1",
                        background: "#e0e7ff",
                        borderRadius: 8,
                        padding: "2px 16px",
                        fontSize: "1rem",
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

        {selectedYear &&
          selectedDept === "Academic / Teaching Positions" &&
          selectedSubDept &&
          !selectedProgram && (
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
                {selectedSubDept} <span style={{ fontWeight: 400, color: "#888" }}>({selectedYear})</span>
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
                  setSelectedSubDept(null);
                  setSelectedProgram(null);
                }}
              >
                Back
              </button>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px #0001",
                padding: "0",
                marginTop: "16px",
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
                <span>Programs</span>
                <span>Number of Faculty</span>
              </div>

              {activePrograms.map((progName) => {
                const cnt = countByPositionProgram(selectedYear, selectedSubDept, progName);
                return (
                  <div
                    key={`${selectedSubDept}-${progName}`}
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
                      fontSize: "1.08rem",
                      transition: "background 0.2s",
                    }}
                    onClick={() => setSelectedProgram(progName)}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#6366f1" style={{ marginRight: 14 }}>
                        <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                      </svg>
                      {progName}
                    </div>
                    <span
                      style={{
                        color: "#6366f1",
                        background: "#e0e7ff",
                        borderRadius: 8,
                        padding: "2px 16px",
                        fontSize: "1rem",
                        fontWeight: 600,
                      }}
                    >
                      {cnt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedYear &&
          selectedDept === "Major Leadership / Administrative Positions" &&
          selectedSubDept === "Deans" &&
          !selectedProgram && (
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
                Deans <span style={{ fontWeight: 400, color: "#888" }}>({selectedYear})</span>
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
                  setSelectedSubDept(null);
                  setSelectedProgram(null);
                }}
              >
                Back
              </button>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px #0001",
                padding: "0",
                marginTop: "16px",
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
                <span>Departments</span>
                <span>Number of Deans</span>
              </div>

              {activePrograms.map((progName) => {
                const cnt = countDeansByProgram(selectedYear, progName);
                return (
                  <div
                    key={`deans-${progName}`}
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
                      fontSize: "1.08rem",
                      transition: "background 0.2s",
                    }}
                    onClick={() => setSelectedProgram(progName)}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#6366f1" style={{ marginRight: 14 }}>
                        <path d="M10 4H2v16h20V6H12l-2-2z" fill="#6366f1" />
                      </svg>
                      {progName}
                    </div>
                    <span
                      style={{
                        color: "#6366f1",
                        background: "#e0e7ff",
                        borderRadius: 8,
                        padding: "2px 16px",
                        fontSize: "1rem",
                        fontWeight: 600,
                      }}
                    >
                      {cnt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedYear && (
                    (!departmentSubfolders[selectedDept] && selectedDept) ||
                    (selectedDept === "Academic / Teaching Positions" && selectedSubDept && selectedProgram) ||
                    (selectedDept === "Major Leadership / Administrative Positions" && selectedSubDept === "Deans" && selectedProgram) ||
                    (selectedSubDept && 
                     selectedDept !== "Academic / Teaching Positions" && 
                     selectedSubDept !== "Deans")
                ) && (
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
                                {(selectedProgram
                                    ? `${selectedSubDept} · ${selectedProgram}`
                                    : (selectedSubDept || selectedDept))}{" "}
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
                                    if (selectedProgram) {
                                        setSelectedProgram(null);
                                    } else if (selectedSubDept && deanDepartments.includes(selectedSubDept)) {
                                        setSelectedSubDept('Deans');
                                    } else if (selectedSubDept) {
                                        setSelectedSubDept(null);
                                    } else {
                                        setSelectedDept(null);
                                    }
                                }}
                            >
                                {selectedProgram ? "Back to Programs" :
                                 (selectedSubDept && deanDepartments.includes(selectedSubDept)) ? "Back to Departments" :
                                 (selectedSubDept ? "Back" : "Back to Departments")}
                            </button>
                        </div>

                        <div className="students-list-table">
                            <div className="students-list-header">
                                <div>Faculty</div>
                                <div>Contact</div>
                                <div>Status</div>
                                <div>Last Updated</div>
                                <div>Actions</div>
                            </div>

                            {currentFacultyList.length > 0 ? (
                                currentFacultyList.map((mem) => (
                                    <div className="students-list-row" key={mem.id}>
                                        <div className="students-list-student">
                                            <img
                                                src={mem.avatar || "/avatar1.png"}
                                                alt={mem.first_name + " " + mem.last_name}
                                                className="students-list-avatar"
                                            />
                                            <div>
                                                <div className="students-list-name">
                                                    {mem.first_name} {mem.last_name}
                                                </div>
                                                <div className="students-list-id">ID: {mem.id}</div>
                                            </div>
                                        </div>
                                        <div className="students-list-contact">
                                            <a href={`mailto:${mem.email}`}>{mem.email}</a>
                                            <div>{mem.phone}</div>
                                        </div>
                                        <div className="students-list-status">
                                            <span
                                                className="students-status-badge"
                                                style={{
                                                    background:
                                                        mem.status === "Active"
                                                            ? "#22c55e"
                                                            : mem.status === "Inactive"
                                                            ? "#f59e42"
                                                            : mem.status === "Graduated"
                                                            ? "#6366f1"
                                                            : mem.status === "Suspended"
                                                            ? "#e11d48"
                                                            : "#aaa",
                                                    color: "#fff",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {mem.status}
                                            </span>
                                        </div>
                                        <div className="students-list-updated">
                                            <span className="students-list-updated-icon">🕒</span>
                                            {mem.updated_at
                                                ? new Date(mem.updated_at).toLocaleString()
                                                : ""}
                                        </div>
                                        <div className="students-list-actions">
                                            <button
                                                className="students-action-btn"
                                                title="Edit"
                                                onClick={() => handleEdit(mem)}
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
                                                onClick={() => handleDeleteClick(mem)}
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
                                <div style={{ padding: 32, color: "#888", textAlign: "center" }}>
                                    No faculty found for this selection.
                                </div>
                            )}
                        </div>
                    </div>
                )}

				{!selectedYear && !showArchived && isSearchActive && (
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
							<div className="students-list-header">
								<div>Faculty</div>
								<div>Job Classifications</div>
								<div>Contact</div>
								<div>Status</div>
								<div>Last Updated</div>
								<div>Actions</div>
							</div>
							{filteredFaculty.length > 0 ? (
								filteredFaculty.map((mem) => (
									<div className="students-list-row" key={mem.id}>
										<div className="students-list-student">
											<img
											 src={mem.avatar || "/avatar1.png"}
											 alt={mem.first_name + " " + mem.last_name}
											 className="students-list-avatar"
											/>
											<div>
												<div className="students-list-name">
													{mem.first_name} {mem.last_name}
												</div>
												<div className="students-list-id">ID: {mem.id}</div>
											</div>
										</div>
										<div className="students-list-contact">
											<div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>
												{mem.department}
											</div>
											{mem.program && mem.program !== mem.department && (
												<div style={{ fontSize: "0.9rem", color: "#6366f1", fontWeight: 500 }}>
													{mem.program}
												</div>
											)}
											{mem.assigned_program && (
												<div style={{ fontSize: "0.85rem", color: "#0ea5e9", marginTop: 2 }}>
													Assigned: {mem.assigned_program}
												</div>
											)}
											{mem.academic_year && (
												<div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>
													SY {mem.academic_year}
												</div>
											)}
										</div>
										<div className="students-list-contact">
											<a href={`mailto:${mem.email}`}>{mem.email}</a>
											<div>{mem.phone}</div>
										</div>
										<div className="students-list-status">
											<span
												className="students-status-badge"
												style={{
													background:
														mem.status === "Active"
															? "#22c55e"
															: mem.status === "Inactive"
															? "#f59e42"
															: mem.status === "Graduated"
															? "#6366f1"
															: mem.status === "Suspended"
															? "#e11d48"
															: "#aaa",
													color: "#fff",
													fontWeight: 600,
												}}
											>
												{mem.status}
											</span>
										</div>
										<div className="students-list-updated">
											<span className="students-list-updated-icon">🕒</span>
											{mem.updated_at
												? new Date(mem.updated_at).toLocaleString()
												: ""}
										</div>
										<div className="students-list-actions" >
											<button
												className="students-action-btn"
												title="Edit"
												onClick={() => handleEdit(mem)}
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
												onClick={() => handleDeleteClick(mem)}
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
									No faculty found.
								</div>
							)}
						</div>
					</div>
				)}

			</div>

			{showModal && (
				<div className="students-modal-bg" onClick={() => setShowModal(false)}>
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
						<div className="students-modal-title">Add Faculty</div>
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
									{allYearFolders.map((year) => (
										<option
											key={year}
											value={year.replace(/^SY\s*/, "")}
										>
											{year}
										</option>
									))}
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
										setForm({ ...form, department: e.target.value, program: "", assigned_program: "" });
									}}
									required
									disabled={!form.academic_year}
								>
									<option value="">Select Department</option>
									{departmentOptions.map((dept) => (
										<option key={dept} value={dept}>
											{dept}
										</option>
									))}
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
										disabled={!form.academic_year || !form.department}
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

							{form.program === 'Deans' && (
								<div className="students-modal-row">
									<label>
										Dean Department <span style={{ color: "#e11d48" }}>*</span>
									</label>
									<select
										name="dean_department"
										value={form.dean_department}
										onChange={e => setForm({ ...form, dean_department: e.target.value })}
										required
										disabled={!form.academic_year || !form.department}
									>
										<option value="">Select Dean Department</option>
										{departments
											.filter(d => (d.status || "").toLowerCase() === "active")
											.sort((a, b) => a.name.localeCompare(b.name))
											.map((d) => (
												<option key={d.id || d.name} value={d.name}>{d.name}</option>
											))}
									</select>
								</div>
							)}
					{form.department === "Academic / Teaching Positions" && form.program && (
						<div className="students-modal-row">
							<label>
								Assigned Academic Program <span style={{ color: "#e11d48" }}>*</span>
							</label>
							<select
								name="assigned_program"
								value={form.assigned_program}
								onChange={e => setForm({ ...form, assigned_program: e.target.value })}
								required
								disabled={!!departmentsError}
							>
								<option value="">Select Program</option>
								{departments
									.filter(d => (d.status || "").toLowerCase() === "active")
									.sort((a, b) => a.name.localeCompare(b.name))
									.map(d => (
										<option key={d.id || d.name} value={d.name}>{d.name}</option>
									))}
							</select>
							{departmentsError && (
								<div style={{ color: "#e11d48", marginTop: 6, fontSize: "0.9rem" }}>
									{departmentsError}
								</div>
							)}
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
									<option value="On leave">On leave</option>
									<option value="Probationary">Probationary</option>
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
									onClick={() => setShowModal(false)}
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
									{loading ? "Adding..." : "Add Faculty"}
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

			{editModal && (
				<div className="students-modal-bg" onClick={() => setEditModal(false)}>
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
						<h2 style={{ color: "green", marginBottom: 0 }}>Edit Faculty</h2>
						<div style={{ marginBottom: 16, color: "#444" }}>
							Update faculty information in FSUU system
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
							{Object.entries(initialState).map(([key, _]) => {
								if (key === "course_id") return null;
								
								if (key === 'dean_department' && editForm.program !== 'Deans') {
									return null;
								}
								if (key === 'assigned_program' && editForm.department !== 'Academic / Teaching Positions') {
									return null;
								}
								return (
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
													setEditForm({ ...editForm, department: e.target.value, program: "", assigned_program: "" });
												}}
												required
											>
												<option value="">Select Department</option>
												{departmentOptions.map((dept) => (
													<option key={dept} value={dept}>
														{dept}
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
										) : key === 'dean_department' ? (
											<select
												name={key}
												value={editForm[key] || ""}
												onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
												required
										
											>
												<option value="">Select Dean Department</option>
												{departments
													.filter(d => (d.status || "").toLowerCase() === "active")
													.sort((a, b) => a.name.localeCompare(b.name))
													.map((d) => (
														<option key={d.id || d.name} value={d.name}>{d.name}</option>
													))}
											</select>
								) : key === 'assigned_program' ? (
									<select
										name={key}
										value={editForm[key] || ""}
										onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
										required
										disabled={!!departmentsError}
									>
										<option value="">Select Assigned Academic Program</option>
										{departments
											.filter(d => (d.status || "").toLowerCase() === "active")
											.sort((a, b) => a.name.localeCompare(b.name))
											.map(d => (
												<option key={d.id || d.name} value={d.name}>{d.name}</option>
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
                                        <option value="On leave">On leave</option>
                                        <option value="Probationary">Probationary</option>
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
                        );
                    })}
                    <div style={{ gridColumn: "1 / span 2", display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                        <button
                            type="button"
                            className="students-modal-cancel"
                            onClick={() => setEditModal(false)}
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
                            {editLoading ? "Updating..." : "Update Faculty"}
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
                                marginTop: 6,
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

    {confirmModal.show && (
        <ConfirmationModal
          message={confirmModal.message}
          onConfirm={confirmAction}
          onCancel={() => setConfirmModal({ show: false, action: null, message: "", label: "" })}
        />
      )}

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
		</div>
	);
};

export default Faculty;