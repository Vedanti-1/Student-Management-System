const API = "https://student-management-api-scvo.onrender.com/api/students";

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

async function loadStudents() {
  try {
    students = await apiRequest(API);
    renderStudents();
  } catch (error) {
    studentList.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.textContent = "Unable to load students. Check that the backend is running.";

    row.appendChild(cell);
    studentList.appendChild(row);

    showMessage(error.message, "error");
  }
}

function renderStudents() {
  const query = document.getElementById("search").value
    .trim()
    .toLowerCase();

  const filteredStudents = students.filter(student => {
    return [
      student.studentId,
      student.name,
      student.email
    ].some(value => String(value || "").toLowerCase().includes(query));
  });

  studentList.replaceChildren();

  if (filteredStudents.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.textContent = query
      ? "No matching students found."
      : "No students added yet.";

    row.appendChild(cell);
    studentList.appendChild(row);
    return;
  }

  filteredStudents.forEach(student => {
    const row = document.createElement("tr");

    [
      student.studentId,
      student.name,
      student.email,
      student.department,
      student.semester,
      student.contact || "-"
    ].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value ?? "";
      row.appendChild(cell);
    });

    const actionsCell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.className = "edit";
    editButton.addEventListener("click", () => editStudent(student));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete";
    deleteButton.addEventListener("click", () => deleteStudent(student._id));

    actionsCell.append(editButton, deleteButton);
    row.appendChild(actionsCell);
    studentList.appendChild(row);
  });
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

      showMessage("Student updated successfully.", "success");
    } else {
      await apiRequest(API, {
        method: "POST",
        body: JSON.stringify(student)
      });

      showMessage("Student added successfully.", "success");
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

  document.getElementById("formTitle").textContent = "Update Student";
  saveButton.textContent = "Save Changes";
  document.getElementById("cancelButton").hidden = false;

  showMessage("Edit the student details and save your changes.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) {
    return;
  }

  try {
    await apiRequest(`${API}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    showMessage("Student deleted successfully.", "success");

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
  document.getElementById("formTitle").textContent = "Add Student";
  saveButton.textContent = "Add Student";
  document.getElementById("cancelButton").hidden = true;
}

document.getElementById("cancelButton").addEventListener("click", () => {
  resetForm();
  showMessage("");
});

document.getElementById("search").addEventListener("input", renderStudents);

loadStudents();