# Troubleshooting Runbook

Use a consistent flow: **confirm the symptom → check service/process → check listening port → test locally → inspect logs → verify dependencies → retest**.

## 1. Website does not open

```bash
systemctl status opsdesk
journalctl -u opsdesk -n 100 --no-pager
ss -lntp | grep ':3000'
curl -i http://127.0.0.1:3000/
curl -i http://127.0.0.1:3000/api/health
```

If local curl works but remote access fails, inspect the cloud security group, host firewall, public IP, and any reverse-proxy configuration. Do not open every port to the internet.

## 2. Service keeps restarting

```bash
systemctl status opsdesk
journalctl -u opsdesk --since '15 minutes ago' --no-pager
node --version
ls -ld /opt/opsdesk /var/lib/opsdesk /var/log/opsdesk
```

Check the Node.js path in `ExecStart`, dependencies, environment variables, directory ownership, and application logs.

## 3. API works but student data fails

```bash
curl -i http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/api/students
ls -lh /var/lib/opsdesk/
journalctl -u opsdesk -n 100 --no-pager
```

Check `DB_PATH`, file/directory permissions, disk capacity, and database integrity. The service user must be able to write to the database directory.

## 4. Port is already in use

```bash
sudo ss -lntp | grep ':3000'
sudo lsof -i :3000
```

Identify the owning process and decide whether to stop it or configure a different `PORT`. Avoid killing unknown processes.

## 5. Permission denied

```bash
namei -l /opt/opsdesk/server.js
ls -ld /opt/opsdesk /var/lib/opsdesk /var/log/opsdesk
id opsdesk
```

Check permissions on every parent directory. Give the application write access only to its data and log directories; do not solve this with `chmod -R 777`.

## 6. Disk or memory pressure

```bash
df -h
du -sh /var/log /var/lib/opsdesk
free -h
top
ps aux --sort=-%mem | head
```

Confirm what is consuming resources before deleting files or restarting services.

## 7. Backup and restore

```bash
./scripts/backup_database.sh
ls -lh backups/
sha256sum -c backups/students_TIMESTAMP.db.sha256
```

Restore only after confirming the correct backup and stopping the application. After restoration, start the service and verify the health endpoint and record count.
