// Primary Render Backend URL
const RENDER_API_ENDPOINT = "https://student-management-api-scvo.onrender.com/api/students";

// Determine the appropriate backend API endpoint dynamically
function resolveApiEndpoint() {
  if (typeof window !== "undefined" && window.API_URL) {
    return window.API_URL;
  }

  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;

    // Opened directly via file protocol (file://)
    if (protocol === "file:") {
      return "http://localhost:5000/api/students";
    }

    // Running on localhost/127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (port === "5000") {
        return "/api/students";
      }
      return "http://localhost:5000/api/students";
    }

    // Running on Vercel or other frontend host -> MUST call Render backend
    if (hostname.includes("vercel.app") || hostname.includes("github.io") || hostname.includes("netlify.app")) {
      return RENDER_API_ENDPOINT;
    }

    // Running on Render backend container directly
    if (hostname.includes("onrender.com")) {
      return "/api/students";
    }
  }

  // Fallback production URL on Render
  return RENDER_API_ENDPOINT;
}

const API = resolveApiEndpoint();
console.log("Student Management System connected to API:", API);

const form = document.getElementById("studentForm");
const studentList = document.getElementById("studentList");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");

let students = [];

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = type;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || result.error || `Request failed (${response.status})`
    );
  }

  return result;
}

function updateDepartmentDropdown() {
  const deptSelect = document.getElementById("filterDept");
  if (!deptSelect) return;
  const currentVal = deptSelect.value;
  const uniqueDepts = Array.from(new Set(students.map(s => (s.department || "").trim()).filter(Boolean))).sort();

  deptSelect.innerHTML = '<option value="">All Departments</option>';
  uniqueDepts.forEach(dept => {
    const opt = document.createElement("option");
    opt.value = dept;
    opt.textContent = dept;
    if (dept === currentVal) opt.selected = true;
    deptSelect.appendChild(opt);
  });
}

function updateStats(filteredCount) {
  const totalStudentsEl = document.getElementById("totalStudentsCount");
  const totalDeptsEl = document.getElementById("totalDepartmentsCount");
  const totalSemsEl = document.getElementById("totalSemestersCount");
  const recordBadge = document.getElementById("recordCountBadge");

  if (totalStudentsEl) {
    totalStudentsEl.textContent = students.length;
  }

  if (totalDeptsEl) {
    const depts = new Set(students.map(s => (s.department || "").trim()).filter(Boolean));
    totalDeptsEl.textContent = depts.size;
  }

  if (totalSemsEl) {
    const sems = new Set(students.map(s => s.semester).filter(Boolean));
    totalSemsEl.textContent = sems.size;
  }

  if (recordBadge) {
    const count = typeof filteredCount === "number" ? filteredCount : students.length;
    recordBadge.textContent = `${count} ${count === 1 ? "Student" : "Students"}`;
  }
}

async function loadStudents() {
  try {
    students = await apiRequest(API);
    updateDepartmentDropdown();
    renderStudents();
  } catch (error) {
    studentList.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.className = "loading-state";
    cell.textContent = "Unable to connect to student database. Backend service may be starting up.";

    row.appendChild(cell);
    studentList.appendChild(row);

    updateStats(0);
    showMessage(error.message, "error");
  }
}

function renderStudents() {
  const searchInput = document.getElementById("search");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const filterDept = document.getElementById("filterDept") ? document.getElementById("filterDept").value.trim().toLowerCase() : "";
  const filterSem = document.getElementById("filterSem") ? document.getElementById("filterSem").value.trim() : "";

  const filteredStudents = students.filter(student => {
    const matchesQuery = !query || [
      student.studentId,
      student.name,
      student.email,
      student.department
    ].some(value => String(value || "").toLowerCase().includes(query));

    const matchesDept = !filterDept || (student.department || "").trim().toLowerCase() === filterDept;
    const matchesSem = !filterSem || String(student.semester) === filterSem;

    return matchesQuery && matchesDept && matchesSem;
  });

  updateStats(filteredStudents.length);
  studentList.replaceChildren();

  if (filteredStudents.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.className = "loading-state";
    cell.textContent = (query || filterDept || filterSem)
      ? "No matching student records found for the applied filter."
      : "No student records found in database. Add a new student above.";

    row.appendChild(cell);
    studentList.appendChild(row);
    return;
  }

  filteredStudents.forEach(student => {
    const row = document.createElement("tr");

    // Student ID cell
    const idCell = document.createElement("td");
    const idBadge = document.createElement("span");
    idBadge.className = "student-id-badge";
    idBadge.textContent = student.studentId || "-";
    idCell.appendChild(idBadge);
    row.appendChild(idCell);

    // Name cell
    const nameCell = document.createElement("td");
    const nameBold = document.createElement("strong");
    nameBold.textContent = student.name || "-";
    nameCell.appendChild(nameBold);
    row.appendChild(nameCell);

    // Email cell
    const emailCell = document.createElement("td");
    emailCell.textContent = student.email || "-";
    row.appendChild(emailCell);

    // Department cell
    const deptCell = document.createElement("td");
    const deptBadge = document.createElement("span");
    deptBadge.className = "dept-badge";
    deptBadge.textContent = student.department || "-";
    deptCell.appendChild(deptBadge);
    row.appendChild(deptCell);

    // Semester cell
    const semCell = document.createElement("td");
    const semBadge = document.createElement("span");
    semBadge.className = "sem-badge";
    semBadge.textContent = student.semester ? `Sem ${student.semester}` : "-";
    semCell.appendChild(semBadge);
    row.appendChild(semCell);

    // Contact cell
    const contactCell = document.createElement("td");
    contactCell.textContent = student.contact || "-";
    row.appendChild(contactCell);

    // Actions cell
    const actionsCell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "✏️ Edit";
    editButton.className = "edit";
    editButton.title = "Edit this student";
    editButton.addEventListener("click", () => editStudent(student));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "🗑️ Delete";
    deleteButton.className = "delete";
    deleteButton.title = "Delete this student";
    deleteButton.addEventListener("click", () => deleteStudent(student._id));

    actionsCell.append(editButton, deleteButton);
    row.appendChild(actionsCell);
    studentList.appendChild(row);
  });
}

function exportToCSV() {
  if (students.length === 0) {
    showMessage("No student records available to export.", "error");
    return;
  }

  const headers = ["Student ID", "Full Name", "Email", "Department", "Semester", "Contact"];
  const rows = students.map(s => [
    `"${(s.studentId || "").replace(/"/g, '""')}"`,
    `"${(s.name || "").replace(/"/g, '""')}"`,
    `"${(s.email || "").replace(/"/g, '""')}"`,
    `"${(s.department || "").replace(/"/g, '""')}"`,
    s.semester || "",
    `"${(s.contact || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Student_Records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showMessage("Student records exported to CSV successfully.", "success");
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const recordId = document.getElementById("recordId").value;

  const student = {
    studentId: document.getElementById("studentId").value.trim(),
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    department: document.getElementById("department").value.trim(),
    semester: Number(document.getElementById("semester").value),
    contact: document.getElementById("contact").value.trim()
  };

  if (
    !student.studentId ||
    !student.name ||
    !student.email ||
    !student.department ||
    !Number.isInteger(student.semester) ||
    student.semester < 1 ||
    student.semester > 12
  ) {
    showMessage("Please complete all required fields correctly.", "error");
    return;
  }

  saveButton.disabled = true;

  try {
    if (recordId) {
      await apiRequest(`${API}/${encodeURIComponent(recordId)}`, {
        method: "PUT",
        body: JSON.stringify(student)
      });

      showMessage("Student record updated successfully.", "success");
    } else {
      await apiRequest(API, {
        method: "POST",
        body: JSON.stringify(student)
      });

      showMessage("Student record created successfully.", "success");
    }

    resetForm();
    await loadStudents();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
});

function editStudent(student) {
  document.getElementById("recordId").value = student._id;
  document.getElementById("studentId").value = student.studentId || "";
  document.getElementById("name").value = student.name || "";
  document.getElementById("email").value = student.email || "";
  document.getElementById("department").value = student.department || "";
  document.getElementById("semester").value = student.semester ?? "";
  document.getElementById("contact").value = student.contact || "";

  document.getElementById("formTitle").textContent = "Update Student Record";
  saveButton.innerHTML = "<span>💾</span> Save Changes";
  document.getElementById("cancelButton").hidden = false;

  showMessage("Edit student information above and click Save Changes.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student record?")) {
    return;
  }

  try {
    await apiRequest(`${API}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    showMessage("Student record deleted successfully.", "success");

    if (document.getElementById("recordId").value === id) {
      resetForm();
    }

    await loadStudents();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function resetForm() {
  form.reset();
  document.getElementById("recordId").value = "";
  document.getElementById("formTitle").textContent = "Add New Student";
  saveButton.innerHTML = "<span>➕</span> Add Student Record";
  document.getElementById("cancelButton").hidden = true;
}

document.getElementById("cancelButton").addEventListener("click", () => {
  resetForm();
  showMessage("");
});

// Event Listeners for Filters & Actions
const searchInput = document.getElementById("search");
if (searchInput) searchInput.addEventListener("input", renderStudents);

const filterDeptEl = document.getElementById("filterDept");
if (filterDeptEl) filterDeptEl.addEventListener("change", renderStudents);

const filterSemEl = document.getElementById("filterSem");
if (filterSemEl) filterSemEl.addEventListener("change", renderStudents);

const exportBtn = document.getElementById("exportBtn");
if (exportBtn) exportBtn.addEventListener("click", exportToCSV);

const refreshBtn = document.getElementById("refreshBtn");
if (refreshBtn) refreshBtn.addEventListener("click", async () => {
  showMessage("Refreshing student database...");
  await loadStudents();
  showMessage("Student database refreshed successfully.", "success");
});

const printBtn = document.getElementById("printBtn");
if (printBtn) printBtn.addEventListener("click", () => window.print());

loadStudents();
