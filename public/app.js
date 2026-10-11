const $ = (selector) => document.querySelector(selector);
const state = { students: [], query: "", toastTimer: null };

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function setHealth(prefix, good, label) {
  $(`#${prefix}-indicator`).className = `health-indicator ${good ? "good" : "bad"}`;
  $(`#${prefix}-health`).textContent = label;
}
function renderStudents() {
  const rows = $("#student-rows");
  $("#total-students").textContent = state.students.length;
  $("#nav-count").textContent = state.students.length;
  $("#record-label").textContent = `${state.students.length} records`;
  $("#table-summary").textContent = `Showing ${state.students.length} student${state.students.length === 1 ? "" : "s"}`;
  if (!state.students.length) {
    rows.innerHTML = '<tr><td colspan="5" class="empty-cell">No students found. Add a record or try another search.</td></tr>';
    return;
  }
  rows.innerHTML = state.students.map((s, i) => `
    <tr>
      <td><div class="student-cell"><div class="student-avatar" style="background:${["#efedff","#e8f7ef","#fff2e2","#eaf4ff"][i%4]};color:${["#625bd5","#26966d","#bd8533","#4d8dc9"][i%4]}">${safeText(initials(s.name))}</div><div><div class="student-name">${safeText(s.name)}</div><div class="student-email">${safeText(s.email)}</div></div></div></td>
      <td><span class="course-chip">${safeText(s.course)}</span></td>
      <td>${safeText(s.city || "—")}</td>
      <td>${safeText(dateLabel(s.created_at))}</td>
      <td><div class="row-actions"><button class="row-action" data-edit="${s.id}" aria-label="Edit ${safeText(s.name)}">Edit</button><button class="row-action delete" data-delete="${s.id}" aria-label="Delete ${safeText(s.name)}">×</button></div></td>
    </tr>`).join("");
}
async function loadStudents() {
  try {
    const data = await api(`/api/students?q=${encodeURIComponent(state.query)}`);
    state.students = data.students;
    renderStudents();
    setHealth("data", true, "Healthy");
  } catch (error) {
    $("#student-rows").innerHTML = `<tr><td colspan="5" class="empty-cell">${safeText(error.message)}</td></tr>`;
    setHealth("data", false, "Unavailable");
    showToast("Could not load student records.");
  }
}
async function loadHealth() {
  try {
    const health = await api("/api/health");
    $("#api-status").textContent = "Healthy";
    $("#database-status").textContent = "Connected";
    $("#uptime").textContent = formatUptime(health.uptimeSeconds);
    setHealth("app", true, "Healthy");
    setHealth("db", health.database === "connected", health.database === "connected" ? "Connected" : "Error");
  } catch {
    $("#api-status").textContent = "Offline";
    $("#database-status").textContent = "Unknown";
    $("#uptime").textContent = "—";
    setHealth("app", false, "Unavailable");
    setHealth("db", false, "Unavailable");
  }
}
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}
function openModal(student = null) {
  $("#student-form").reset();
  $("#form-error").textContent = "";
  $("#student-id").value = student?.id || "";
  $("#modal-title").textContent = student ? "Edit student" : "Add student";
  $("#save-btn").textContent = student ? "Save changes" : "Save student";
  if (student) {
    $("#student-name").value = student.name;
    $("#student-email").value = student.email;
    $("#student-course").value = student.course;
    $("#student-city").value = student.city || "";
  }
  $("#modal-backdrop").hidden = false;
  $("#student-name").focus();
}
function closeModal() { $("#modal-backdrop").hidden = true; }
async function submitStudent(event) {
  event.preventDefault();
  const id = $("#student-id").value;
  const student = {
    name: $("#student-name").value.trim(),
    email: $("#student-email").value.trim(),
    course: $("#student-course").value.trim(),
    city: $("#student-city").value.trim()
  };
  try {
    await api(id ? `/api/students/${id}` : "/api/students", {
      method: id ? "PUT" : "POST", body: JSON.stringify(student)
    });
    closeModal();
    await Promise.all([loadStudents(), loadHealth()]);
    showToast(id ? "Student details updated." : "Student added successfully.");
  } catch (error) {
    $("#form-error").textContent = error.message;
  }
}
function exportCsv() {
  const columns = ["id", "name", "email", "course", "city", "created_at"];
  const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [columns.join(","), ...state.students.map(s => columns.map(k => quote(s[k])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = "student-records.csv"; a.click();
  URL.revokeObjectURL(url);
  showToast("CSV export prepared.");
}

$("#add-open").addEventListener("click", () => openModal());
$("#modal-close").addEventListener("click", closeModal);
$("#cancel-btn").addEventListener("click", closeModal);
$("#modal-backdrop").addEventListener("click", e => { if (e.target === $("#modal-backdrop")) closeModal(); });
$("#student-form").addEventListener("submit", submitStudent);
$("#refresh-btn").addEventListener("click", async () => { await Promise.all([loadStudents(), loadHealth()]); showToast("Portal refreshed."); });
$("#export-btn").addEventListener("click", exportCsv);
$("#search-input").addEventListener("input", e => {
  state.query = e.target.value;
  clearTimeout(window.searchDebounce);
  window.searchDebounce = setTimeout(loadStudents, 220);
});
$("#student-rows").addEventListener("click", async e => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");
  if (edit) {
    const student = state.students.find(s => s.id === Number(edit.dataset.edit));
    if (student) openModal(student);
  }
  if (del) {
    const id = Number(del.dataset.delete);
    const student = state.students.find(s => s.id === id);
    if (!student || !confirm(`Delete ${student.name} from the student directory?`)) return;
    try {
      await api(`/api/students/${id}`, { method: "DELETE" });
      await loadStudents();
      showToast("Student record deleted.");
    } catch (error) { showToast(error.message); }
  }
});
document.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    showToast("Command copied.");
  } catch {
    showToast(button.dataset.copy);
  }
}));
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
  if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    e.preventDefault(); $("#search-input").focus();
  }
});
Promise.all([loadStudents(), loadHealth()]);
