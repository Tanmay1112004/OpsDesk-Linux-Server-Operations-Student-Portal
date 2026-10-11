# Resume and Interview Notes

## Resume project title
**Linux Server Operations & Student Portal | Node.js, SQLite, Bash, systemd**

## Resume bullets — use only after you personally complete and verify them
- Built and deployed a responsive student-management portal using HTML, CSS, JavaScript, Node.js, Express, and SQLite.
- Practiced Linux service management, process inspection, filesystem permissions, TCP-port checks, and log-based troubleshooting.
- Developed Bash utilities for application health checks, system reporting, database backup/restore, and log retention.
- Configured a systemd unit for restart-on-failure behavior and boot-time service management.
- Verified API health and database connectivity with `curl`; diagnosed service and port issues with `systemctl`, `journalctl`, and `ss`.

## 30-second interview pitch
“I built a Linux Server Operations project around a student portal. The UI is made with HTML, CSS, and JavaScript, while a Node.js API stores student records in SQLite. My main learning was operating the application on Linux: checking service status, listening ports, permissions, memory and disk usage, and investigating logs. I also wrote Bash scripts for health checks, system reports, and database backup and restore. This helped me connect individual Linux commands to real support and administration tasks.”

## Be ready to explain
1. What happens from browser request to database query?
2. Why does the app need a service manager such as systemd?
3. Difference between `systemctl start` and `systemctl enable`?
4. How would you debug a website that is unavailable externally?
5. What is the difference between a process and a service?
6. Why should an application run as a non-root user?
7. How do `chmod`, `chown`, and `umask` differ?
8. Why is checking `curl localhost` useful before testing from another machine?
9. What is the difference between application logs and `journalctl` output?
10. How would you prove that a backup can be restored?

## Do not claim without evidence
Do not claim high availability, production readiness, security auditing, monitoring dashboards, cloud deployment, or zero downtime unless you actually implement and test those items.
