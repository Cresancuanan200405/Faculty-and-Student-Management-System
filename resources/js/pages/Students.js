import React, { useState, useEffect, useRef } from "react";
import axios from "../axios";
import "../../sass/Students.scss";

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
};

const departmentOptions = [
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
  const [editLoading, setEditLoading] = useState(false);
  const [customYears, setCustomYears] = useState(() => {
    const saved = localStorage.getItem("customYears");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYearStart, setNewYearStart] = useState("");
  const [addYearSuccess, setAddYearSuccess] = useState(false);
  const [yearMenuOpen, setYearMenuOpen] = useState(null);
  const yearMenuRef = useRef(null);
  const [archivedYears, setArchivedYears] = useState(() => {
    const saved = localStorage.getItem("archivedYears");
    return saved ? JSON.parse(saved) : [];
  });
  const [archiveYearSuccess, setArchiveYearSuccess] = useState(false);
  const [restoreYearSuccess, setRestoreYearSuccess] = useState(false);
  const [restoredYearLabel, setRestoredYearLabel] = useState("");
  const [addYearError, setAddYearError] = useState("");
  const [deleteYearSuccess, setDeleteYearSuccess] = useState(false);
  const [studentAddSuccess, setStudentAddSuccess] = useState(false);
  const [studentDeleteSuccess, setStudentDeleteSuccess] = useState(false);
  const [studentEditSuccess, setStudentEditSuccess] = useState(false);

  const allYearFolders = [...yearFolders, ...customYears];

  // Success message timeouts
  useEffect(() => {
    if (addYearSuccess) {
      const t = setTimeout(() => setAddYearSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [addYearSuccess]);

  useEffect(() => {
    if (archiveYearSuccess) {
      const t = setTimeout(() => setArchiveYearSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [archiveYearSuccess]);

  useEffect(() => {
    if (restoreYearSuccess) {
      const t = setTimeout(() => setRestoreYearSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [restoreYearSuccess]);

  useEffect(() => {
    if (deleteYearSuccess) {
      const t = setTimeout(() => setDeleteYearSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [deleteYearSuccess]);

  useEffect(() => {
    if (studentAddSuccess) {
      const t = setTimeout(() => setStudentAddSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [studentAddSuccess]);

  useEffect(() => {
    if (studentDeleteSuccess) {
      const t = setTimeout(() => setStudentDeleteSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [studentDeleteSuccess]);

  useEffect(() => {
    if (studentEditSuccess) {
      const t = setTimeout(() => setStudentEditSuccess(false), 2000);
      return () => clearTimeout(t);
    }
  }, [studentEditSuccess]);

  useEffect(() => {
    localStorage.setItem("customYears", JSON.stringify(customYears));
  }, [customYears]);

  useEffect(() => {
    localStorage.setItem("archivedYears", JSON.stringify(archivedYears));
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
    const submitData = { ...form };
    // Remove "SY " prefix if present
    if (submitData.academic_year.startsWith("SY ")) {
      submitData.academic_year = submitData.academic_year.replace(/^SY\s*/, "");
    }
    if (!departmentSubfolders[form.department]) {
      delete submitData.program;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/students", submitData);
      setStudents((prev) => [
        ...(prev || []),
        res.data.student || submitData
      ]);
      setMessage("Student added successfully!");
      setShowModal(false);
      setForm(initialState);
      setStudentAddSuccess(true);
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
          "Failed to add student."
        );
      }
    }
    setLoading(false);
  };

  const handleEdit = (student) => {
    // Fill missing keys with empty string
    const filledStudent = { ...initialState, ...student };

    // Try to find the correct department and program for the student
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
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError("");
    try {
      await axios.put(`/api/students/${editId}`, editForm);
      const refreshed = await axios.get("/api/students");
      setStudents(refreshed.data.students || []);
      setEditModal(false);
      setStudentEditSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : "Failed to update student.")
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
    // Check for duplicates (case-insensitive)
    const exists = allYearFolders.some(
      (y) => y.toLowerCase() === label.toLowerCase()
    );
    if (exists) {
      setAddYearError("This School Year folder already exists.");
      return;
    }
    setCustomYears((prev) => [...prev, label]);
    setAddYearSuccess(true);
    setShowAddYearModal(false);
    setNewYearStart("");
  };

  const handleDeleteYear = (label) => {
    const input = window.prompt(
      `Type CONFIRM to permanently delete the folder "${label}". This cannot be undone.`
    );
    if (input && input.trim().toLowerCase() === "confirm") {
      setCustomYears((prev) => prev.filter((y) => y !== label));
      setYearMenuOpen(null);
      setDeleteYearSuccess(true);
    }
  };

  const handleArchiveYear = (label) => {
    if (!archivedYears.includes(label)) {
      setArchivedYears((prev) => [...prev, label]);
      setArchiveYearSuccess(true);
    }
    setYearMenuOpen(null);
  };

  const handleRestoreYear = (label) => {
    const input = window.prompt(
      `Type CONFIRM to restore the folder "${label}" from the archives.`
    );
    if (input && input.trim().toLowerCase() === "confirm") {
      setArchivedYears((prev) => prev.filter((y) => y !== label));
      setRestoredYearLabel(label);
      setRestoreYearSuccess(true);
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

  const visibleYearFolders = allYearFolders.filter(
    (label) => !archivedYears.includes(label)
  );

  const handleDeleteClick = async (student) => {
    const input = window.prompt(
      `Type CONFIRM to permanently delete the student "${student.first_name} ${student.last_name}". This cannot be undone.`
    );
    if (input && input.trim().toLowerCase() === "confirm") {
      try {
        await axios.delete(`/api/students/${student.id}`);
        setStudents(students.filter(s => s.id !== student.id));
        setStudentDeleteSuccess(true);
      } catch (err) {
        alert("Failed to delete student.");
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

  const getStudentCountForYear = (label) => {
    if (studentsByYearDept[label]) {
      return Object.values(studentsByYearDept[label]).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
    }
    return 0;
  };

  return (
    <div className="students-root">
      {/* Success Popups */}
      {deleteYearSuccess && (
        <div className="students-success-message delete" style={{ background: "#fee2e2", color: "#b91c1c" }}>
          School Year folder deleted successfully!
        </div>
      )}
      {studentAddSuccess && (
        <div className="students-success-message add" style={{ background: "#dcfce7", color: "#15803d" }}>
          Student added successfully!
        </div>
      )}
      {studentDeleteSuccess && (
        <div className="students-success-message delete" style={{ background: "#fee2e2", color: "#b91c1c" }}>
          Student deleted successfully!
        </div>
      )}
      {studentEditSuccess && (
        <div className="students-success-message edit" style={{ background: "#fef9c3", color: "#b45309" }}>
          Student updated successfully!
        </div>
      )}

      <div className="students-banner">
        <div className="students-banner-title">Student Management</div>
        <div className="students-banner-sub">
          FSUU - Manage student records and academic information
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
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="students-list-card">
        {/* Success messages */}
        {addYearSuccess && (
          <div className="students-success-message add">
            School Year folder added successfully!
          </div>
        )}
        {archiveYearSuccess && (
          <div className="students-success-message archive">
            School Year folder archived successfully!
          </div>
        )}
        {restoreYearSuccess && (
          <div className="students-success-message restore" style={{ background: "#fef9c3", color: "#b45309" }}>
            Folder <b>{restoredYearLabel}</b> has been restored from the archives!
          </div>
        )}

        {/* Main Folders UI */}
        {!selectedYear && !showArchived && !isSearchActive && (
          <div className="students-folders-container">
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              {visibleYearFolders.map((label) => {
                const total = getStudentCountForYear(label);
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
                            onClick={() => handleArchiveYear(label)}
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

        {/* Archived Folders UI */}
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
                    onClick={() => handleRestoreYear(label)}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Folders UI */}
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
            {/* Department folders in a vertical list with header */}
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
                <span>Number of Students</span>
              </div>
              {departmentOptions.map((dept) => (
                <div
                  key={dept}
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
                  onClick={() => setSelectedDept(dept)}
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
                    {dept}
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
                    {
                      departmentSubfolders[dept]
                        ? departmentSubfolders[dept].reduce(
                            (sum, prog) =>
                              sum +
                              ((studentsByYearDept[selectedYear] &&
                                studentsByYearDept[selectedYear][prog])
                                ? studentsByYearDept[selectedYear][prog].length
                                : 0),
                            0
                          )
                        : (studentsByYearDept[selectedYear] &&
                            studentsByYearDept[selectedYear][dept])
                        ? studentsByYearDept[selectedYear][dept].length
                        : 0
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subfolders for departments with programs */}
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
                Back to Departments
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
                <span>Program</span>
                <span>Number of Students</span>
              </div>
              {departmentSubfolders[selectedDept].map((sub) => (
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
                    {
                      (studentsByYearDept[selectedYear] &&
                        studentsByYearDept[selectedYear][sub])
                        ? studentsByYearDept[selectedYear][sub].length
                        : 0
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students List for selected year & department or subdepartment */}
        {selectedYear && (
          (!departmentSubfolders[selectedDept] && selectedDept) ||
          selectedSubDept
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
                {(selectedSubDept || selectedDept)}{" "}
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
                  if (selectedSubDept) setSelectedSubDept(null);
                  else setSelectedDept(null);
                }}
              >
                {selectedSubDept ? "Back to Programs" : "Back to Departments"}
              </button>
            </div>
            {/* Students Table */}
            <div className="students-list-table">
              <div className="students-list-header">
                <div>Student</div>
                <div>Contact</div>
                <div>Status</div>
                <div>Last Updated</div>
                <div>Actions</div>
              </div>
              {(studentsByYearDept[selectedYear] &&
                studentsByYearDept[selectedYear][selectedSubDept || selectedDept] &&
                studentsByYearDept[selectedYear][selectedSubDept || selectedDept].length > 0) ? (
                studentsByYearDept[selectedYear][selectedSubDept || selectedDept].map((stu) => (
                  <div className="students-list-row" key={stu.id}>
                    <div className="students-list-student">
                      <img
                        src={stu.avatar || "/avatar1.png"}
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
                          color:
                            stu.status === "Graduated"
                              ? "#fff"
                              : "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {stu.status}
                      </span>
                    </div>
                    <div className="students-list-updated">
                      <span className="students-list-updated-icon">🕒</span>
                      {stu.updated_at
                        ? new Date(stu.updated_at).toLocaleString()
                        : ""}
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
                  No students found for this department and year.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show filtered students list if searching */}
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
                <div>Student</div>
                <div>Department/Program</div>
                <div>Contact</div>
                <div>Status</div>
                <div>Last Updated</div>
                <div>Actions</div>
              </div>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((stu) => (
                  <div className="students-list-row" key={stu.id}>
                    <div className="students-list-student">
                      <img
                        src={stu.avatar || "/avatar1.png"}
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
                      {stu.updated_at
                        ? new Date(stu.updated_at).toLocaleString()
                        : ""}
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
      </div>

      {/* Modal for Add Student */}
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
                    setForm({ ...form, department: e.target.value, program: "" });
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
              </div>
              {/* Show program dropdown if department has subfolders */}
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
                <label>Course ID</label>
                <input
                  type="text"
                  name="course_id"
                  value={form.course_id}
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

      {/* Modal for Edit Student */}
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
                      required={key !== "phone" && key !== "course_id"}
                    />
                  )}
                </div>
              ))}
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

      {/* Add SY Folder Modal */}
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
    </div>
  );
};

export default Students;