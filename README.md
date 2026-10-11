# OpsDesk — Linux Server Operations & Student Portal

A resume-oriented Linux administration lab: a responsive student portal backed by a Node.js API and SQLite, plus Bash tools for health checks, system reporting, backups, restore verification, and log cleanup.

> **Main learning goal:** connect Linux fundamentals to a running application—not just memorize commands. The portal is the workload; service management, permissions, networking, logs, automation, and recovery are the operations work.

## Features

- Responsive dashboard UI with student CRUD, search, and CSV export
- REST endpoints for student records and an application health endpoint
- SQLite database with parameterized queries, unique email constraint, and sample records
- Bash scripts for host/application health checks, system reports, database backup/restore, and log cleanup
- Example systemd service unit with a dedicated non-root service account
- Troubleshooting runbook and resume/interview notes

## Architecture

```text
Browser (HTML / CSS / JavaScript)
              |
              | HTTP
              v
       Node.js + Express
         |           |
         |           +---- /api/health
         |
         v
       SQLite DB  ------> application.log
         |
         +---- Bash backup/restore scripts

Linux host operations:
systemd | users/groups | permissions | processes | TCP ports | journalctl | cron
```

The supplied systemd unit is an example deployment template; it is **not installed automatically**. Complete the deployment steps and adapt paths to your Linux host.

## Tech stack

- UI: HTML5, CSS3, vanilla JavaScript
- API: Node.js 20+, Express
- Database: SQLite via `better-sqlite3`
- Operations: Bash, systemd, `curl`, `ss`, `journalctl`, `df`, `free`, `ip`, `sha256sum`
- Target lab: Amazon Linux 2023 or Fedora; local development works on systems with supported Node.js build prerequisites

## Repository layout

```text
linux-ops-student-portal/
├── README.md
├── package.json
├── server.js
├── .env.example
├── .gitignore
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── database/
│   └── schema.sql
├── scripts/
│   ├── install_linux.sh
│   ├── health_check.sh
│   ├── system_report.sh
│   ├── backup_database.sh
│   ├── restore_database.sh
│   └── cleanup_logs.sh
├── deploy/
│   ├── opsdesk.service
│   └── opsdesk-logrotate.conf
├── docs/
│   ├── linux-commands.md
│   ├── troubleshooting.md
│   └── resume-points.md
├── data/       # created at runtime; database is not committed
├── logs/       # created at runtime; logs are not committed
└── backups/    # generated backup files are not committed
```

## Requirements

- Node.js 20 or newer and npm
- On Linux, compiler/build prerequisites may be needed by `better-sqlite3` (for example `gcc-c++`, `make`, and Python 3)
- Bash and common Linux utilities for the operations scripts
- `curl` for health checks

## Step-by-step: run locally first

### 1. Inspect the machine

```bash
uname -a
cat /etc/os-release
whoami
id
df -h
free -h
node --version
npm --version
```

If Node.js is missing, install a supported Node.js 20+ release for your distribution, then reopen the shell and verify the versions. Do not assume the package version available in every OS repository is new enough.

### 2. Get the project and install dependencies

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd linux-ops-student-portal
chmod +x scripts/*.sh
npm install
mkdir -p data logs backups
```

If you are starting from your own local directory, skip `git clone`.

### 3. Start the application

```bash
npm start
```

Open `http://localhost:3000` in your browser. The app creates `data/students.db`, the table, and three sample rows the first time it starts.

In a second terminal, test the endpoints:

```bash
curl -i http://127.0.0.1:3000/
curl -s http://127.0.0.1:3000/api/health
curl -s http://127.0.0.1:3000/api/students
ss -lntp | grep ':3000'
```

Stop the foreground app with `Ctrl+C` when finished. The database persists between runs.

### 4. Test student operations

- Add a record from **Add student**.
- Search by name, email, course, or city.
- Edit the record and verify the change.
- Delete a test record.
- Export the visible results to CSV.
- Try adding a duplicate email; the API should reject it.

Do not use real personal student information in a public demo.

### 5. Generate a system report

```bash
./scripts/system_report.sh
./scripts/system_report.sh logs/system-report.txt
```

Read the output. Explain what hostname, OS/kernel, load average, memory, filesystem capacity, IP addresses, routes, and listening sockets mean.

### 6. Run the health check

With the app running in one terminal:

```bash
./scripts/health_check.sh
```

Expected: the HTTP health endpoint responds and the script reports disk, memory, uptime, and service status. If you launched with `npm start`, a warning that the `opsdesk` systemd unit is not installed is expected.

### 7. Back up the database

With the app running:

```bash
./scripts/backup_database.sh
ls -lh backups/
```

The script uses SQLite's backup API, creates a timestamped snapshot, writes a SHA-256 checksum, and removes old backups according to the retention setting. Verify a checksum:

```bash
sha256sum -c backups/students_TIMESTAMP.db.sha256
```

Replace `TIMESTAMP` with the actual filename. Keep backups private; do not commit them to Git.

### 8. Practice a restore safely

Use a lab copy, not your only working database. The restore script asks you to type `RESTORE`, checks the checksum when present, and refuses to overwrite a live `opsdesk` service.

```bash
./scripts/restore_database.sh ./backups/students_TIMESTAMP.db
```

After restoring, start the application and verify `/api/health` and `/api/students`.

### 9. Practice logs and process checks

While the app runs with `npm start`, inspect its terminal output and `logs/application.log`:

```bash
tail -f logs/application.log
ps aux | grep '[n]ode server.js'
pgrep -a node
```

When deployed with systemd:

```bash
sudo systemctl status opsdesk
sudo journalctl -u opsdesk -n 50 --no-pager
sudo journalctl -u opsdesk -f
```

### 10. Use the troubleshooting runbook

Work through [`docs/troubleshooting.md`](docs/troubleshooting.md). For each failure, record:
- symptom and impact
- commands used to investigate
- root cause
- corrective action
- evidence that the fix worked

## Linux deployment lab (Amazon Linux 2023 / Fedora)

**Use a test VM or EC2 instance. Cloud resources may incur charges.** Do not open SSH to the whole internet. Restrict SSH to your own trusted IP and do not expose the database file or database service publicly.

### 1. Install prerequisites

Review `scripts/install_linux.sh`, then run:

```bash
chmod +x scripts/install_linux.sh
./scripts/install_linux.sh
```

This script installs common build prerequisites through DNF and verifies Node.js 20+. It intentionally does not silently install an unverified Node.js repository configuration; install Node.js from a trusted, current source for your OS if it is missing.

### 2. Create a dedicated service account and directories

After copying the project to `/opt/opsdesk` and installing dependencies in that directory:

```bash
sudo useradd --system --home-dir /var/lib/opsdesk --shell /sbin/nologin opsdesk
sudo install -d -o opsdesk -g opsdesk -m 750 /var/lib/opsdesk
sudo install -d -o opsdesk -g opsdesk -m 750 /var/log/opsdesk
sudo chown -R root:opsdesk /opt/opsdesk
sudo chmod -R o-rwx /opt/opsdesk
```

Keep application code read-only to the service user. The database directory must be writable by the service account. If you want application logs under `/var/log/opsdesk`, configure and test that path deliberately; the default project writes to its local `logs/` directory.

### 3. Prepare the database directory

The example service sets `DB_PATH=/var/lib/opsdesk/students.db`. Start the app once under the intended service account (or initialize the database in a controlled way) so that the SQLite database and its journal/WAL files are owned by `opsdesk`.

### 4. Install and review the systemd unit

The example unit is in `deploy/opsdesk.service`. It assumes:
- project code at `/opt/opsdesk`
- Node.js executable at `/usr/bin/node`
- database at `/var/lib/opsdesk/students.db`
- a service account named `opsdesk`

Verify those paths first:

```bash
command -v node
ls -l /opt/opsdesk/server.js
```

Copy and start the service:

```bash
sudo cp deploy/opsdesk.service /etc/systemd/system/opsdesk.service
sudo systemctl daemon-reload
sudo systemctl enable --now opsdesk
sudo systemctl status opsdesk
```

If Node.js is installed elsewhere, update `ExecStart` to the correct absolute path. The `ProtectSystem` and `ReadWritePaths` settings are additional hardening examples; test them against your chosen directory layout.

### 5. Test the running service

```bash
curl -i http://127.0.0.1:3000/api/health
sudo journalctl -u opsdesk -n 50 --no-pager
sudo ss -lntp | grep ':3000'
./scripts/health_check.sh
```

For remote access, a safer next step is to configure a reverse proxy such as Apache or Nginx on ports 80/443 and keep port 3000 restricted to localhost. If temporarily testing direct access, limit the cloud security-group source to your own IP and remove the rule afterwards. Configure HTTPS before using real data.

### 6. Automate backups with Cron

Test the script manually before scheduling it. For a systemd deployment, set `DB_PATH` and `BACKUP_DIR` explicitly and use an account that has read access to the database and write access to the backup directory. SQLite online backups are preferred over copying a live database file.

Example root crontab entry for a deployment with a reviewed absolute path:

```cron
15 2 * * * DB_PATH=/var/lib/opsdesk/students.db BACKUP_DIR=/var/backups/opsdesk /opt/opsdesk/scripts/backup_database.sh >> /var/log/opsdesk-backup.log 2>&1
```

Create `/var/backups/opsdesk` with restrictive ownership and permissions first. Confirm the schedule and logs:

```bash
sudo crontab -l
sudo tail -n 50 /var/log/opsdesk-backup.log
```

Cron has a limited environment; use absolute paths and explicitly set required environment variables.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | App/database health |
| `GET` | `/api/students` | List students; optional `?q=search` |
| `POST` | `/api/students` | Create a student |
| `PUT` | `/api/students/:id` | Update a student |
| `DELETE` | `/api/students/:id` | Delete a student |

Example:

```bash
curl -s http://127.0.0.1:3000/api/health
curl -s -X POST http://127.0.0.1:3000/api/students \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo User","email":"demo@example.com","course":"Linux","city":"Pune"}'
```

## Security notes

- Run the service as a dedicated non-root user.
- Do not commit `.env`, real data, database files, logs, backups, or credentials.
- Keep SSH restricted to a trusted source IP.
- Do not expose port 3306; this project uses a local SQLite file, not a network database.
- Use prepared/parameterized database statements and validate user input.
- Restrict write access to application data and log directories.
- Use a reverse proxy and HTTPS for a remote demo; avoid sending real personal information.
- This is a learning/portfolio project, not a fully audited production system. It does not include authentication/authorization; do not expose the student-management functions publicly without adding them.

## Suggested verification checklist

- [ ] App starts and the dashboard loads.
- [ ] Add, search, edit, and delete all work.
- [ ] Duplicate email is rejected.
- [ ] `/api/health` reports database connectivity.
- [ ] System report is generated and understood.
- [ ] Health-check script runs and failure output is understood.
- [ ] Database backup and checksum verification succeed.
- [ ] Restore is tested on a disposable copy.
- [ ] systemd service starts at boot and restarts after a controlled failure.
- [ ] Logs are reviewed and a troubleshooting note is written.
- [ ] Screenshots are added to `screenshots/` after you run the project.
- [ ] Repository is pushed to GitHub without secrets or runtime data.

## Resume description

Use these bullets **only after you have implemented and tested each item**:

- Built a responsive student-management portal using HTML, CSS, JavaScript, Node.js, Express, and SQLite.
- Practiced Linux service operations, process inspection, file permissions, TCP port diagnostics, and log-based troubleshooting.
- Wrote Bash scripts for host/application health checks, system reporting, and database backup/restore with checksum verification.
- Prepared a systemd deployment unit with a dedicated service account and restart-on-failure behavior.

For a short interview pitch and project Q&A, see [`docs/resume-points.md`](docs/resume-points.md).

## Next improvements

1. Add authentication and role-based access.
2. Put Apache/Nginx in front as a reverse proxy and configure HTTPS.
3. Ship logs through journald or a structured logging service.
4. Add a tested systemd timer or cron backup with restore drills.
5. Add automated tests and a GitHub Actions workflow.
6. Add CloudWatch metrics/logs when deploying to AWS.
7. Containerize with Docker only after the Linux/systemd version is understood.
