const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "students.db");
const LOG_DIR = process.env.LOG_DIR || path.join(ROOT, "logs");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    course TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const count = db.prepare("SELECT COUNT(*) AS total FROM students").get().total;
if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO students (name, email, course, city) VALUES (?, ?, ?, ?)"
  );
  const seed = db.transaction(() => {
    insert.run("Aarav Patil", "aarav@example.com", "Linux Administration", "Pune");
    insert.run("Priya Sharma", "priya@example.com", "AWS Cloud", "Mumbai");
    insert.run("Rohan Deshmukh", "rohan@example.com", "DevOps Foundations", "Nashik");
  });
  seed();
}

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(ROOT, "public")));

function logEvent(level, message, details = {}) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...details
  });
  fs.appendFile(path.join(LOG_DIR, "application.log"), line + "\n", (err) => {
    if (err) console.error("Unable to write application log:", err.message);
  });
  console.log(line);
}

function validateStudent(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const course = String(body.course || "").trim();
  const city = String(body.city || "").trim();

  if (!name || !email || !course) {
    return { error: "Name, email, and course are required." };
  }
  if (name.length > 100 || email.length > 160 || course.length > 100 || city.length > 100) {
    return { error: "One or more fields exceed the allowed length." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  return { student: { name, email, course, city } };
}

app.get("/api/health", (_req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({
      status: "ok",
      application: "Linux Ops Student Portal",
      database: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logEvent("error", "Health check failed", { error: err.message });
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.get("/api/students", (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 100);
  const students = q
    ? db.prepare(`
        SELECT * FROM students
        WHERE name LIKE ? OR email LIKE ? OR course LIKE ? OR city LIKE ?
        ORDER BY id DESC
      `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare("SELECT * FROM students ORDER BY id DESC").all();
  res.json({ students, total: students.length });
});

app.post("/api/students", (req, res) => {
  const checked = validateStudent(req.body);
  if (checked.error) return res.status(400).json({ error: checked.error });
  try {
    const result = db.prepare(
      "INSERT INTO students (name, email, course, city) VALUES (@name, @email, @course, @city)"
    ).run(checked.student);
    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(result.lastInsertRowid);
    logEvent("info", "Student created", { studentId: student.id });
    res.status(201).json({ student });
  } catch (err) {
    if (String(err.code).includes("CONSTRAINT")) {
      return res.status(409).json({ error: "That email address is already registered." });
    }
    logEvent("error", "Create student failed", { error: err.message });
    res.status(500).json({ error: "Unable to create student." });
  }
});

app.put("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid student ID." });
  const checked = validateStudent(req.body);
  if (checked.error) return res.status(400).json({ error: checked.error });

  try {
    const result = db.prepare(
      "UPDATE students SET name=@name, email=@email, course=@course, city=@city WHERE id=@id"
    ).run({ ...checked.student, id });
    if (!result.changes) return res.status(404).json({ error: "Student not found." });
    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(id);
    logEvent("info", "Student updated", { studentId: id });
    res.json({ student });
  } catch (err) {
    if (String(err.code).includes("CONSTRAINT")) {
      return res.status(409).json({ error: "That email address is already registered." });
    }
    logEvent("error", "Update student failed", { studentId: id, error: err.message });
    res.status(500).json({ error: "Unable to update student." });
  }
});

app.delete("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid student ID." });
  const result = db.prepare("DELETE FROM students WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "Student not found." });
  logEvent("info", "Student deleted", { studentId: id });
  res.json({ message: "Student deleted." });
});

app.use((err, _req, res, _next) => {
  logEvent("error", "Unhandled request error", { error: err.message });
  res.status(500).json({ error: "Unexpected server error." });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  logEvent("info", "Application started", { port: PORT, dbPath: DB_PATH });
});

function shutdown(signal) {
  logEvent("info", "Shutdown requested", { signal });
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
