# Step-by-Step Project Plan

## Phase 1 — Understand the workload
**Goal:** see why Linux operations matter.

1. Read the architecture in `README.md`.
2. Explain the request path: browser → Node/Express → SQLite → JSON response → UI.
3. Start the application with `npm start`.
4. In another terminal, run `curl`, `ss`, `ps`, `free`, and `df`.
5. Stop the application with Ctrl+C and observe what breaks.

**Deliverable:** a short note describing the process, port, database path, and logs.

## Phase 2 — Build confidence with the UI
**Goal:** verify the application works before deployment.

1. Add a test student.
2. Search for the student.
3. Edit the course and city.
4. Export CSV.
5. Delete the test record.
6. Try a duplicate email and explain the error.

**Deliverable:** screenshots of the dashboard and student CRUD operations.

## Phase 3 — Linux service and process operations
**Goal:** connect commands to a live process.

1. Check the Node process with `pgrep -a node` and `ps aux`.
2. Identify the listening port with `ss -lntp`.
3. Test locally with `curl -i http://127.0.0.1:3000/api/health`.
4. Generate a system report.
5. Run the health-check script.
6. On a disposable Linux VM, install and test the systemd unit.

**Deliverable:** command log with expected output and a short explanation for each command.

## Phase 4 — Permissions and service account
**Goal:** avoid running an application as root.

1. Create a dedicated `opsdesk` system user.
2. Put persistent database data in `/var/lib/opsdesk`.
3. Keep code owned by root and read-only to the service user.
4. Allow write access only to data/log directories.
5. Use `namei -l`, `ls -l`, `id`, and `systemctl status` to debug access problems.

**Deliverable:** a permission table listing path, owner, group, and mode.

## Phase 5 — Logs and troubleshooting
**Goal:** diagnose instead of guessing.

Practice in a test environment:
- Stop the app, then run the health check.
- Change the configured port and observe the mismatch.
- Temporarily remove a required permission, observe the error, then restore it.
- Review `journalctl` and `logs/application.log`.
- Write the symptom, command, cause, fix, and validation for each case.

**Deliverable:** at least three completed incident notes in `docs/troubleshooting.md`.

## Phase 6 — Backup and recovery
**Goal:** show that data can be recovered.

1. Create a few test records.
2. Run `scripts/backup_database.sh`.
3. Verify the SHA-256 checksum.
4. Restore the backup to a disposable test path or use the restore script after stopping the service.
5. Check the API and compare record counts.

**Deliverable:** backup file, checksum result, and restore validation notes. Do not commit the actual database backup.

## Phase 7 — GitHub and resume
**Goal:** make the work easy for an interviewer to review.

1. Review `.gitignore` and `git status`.
2. Confirm no `.env`, database, log, or backup files are staged.
3. Add screenshots you captured yourself.
4. Push the repository to GitHub.
5. Use resume bullets only for completed and tested features.
6. Practice the pitch in `docs/resume-points.md`.

**Final evidence:** public repository, screenshots, architecture explanation, and three troubleshooting examples.
