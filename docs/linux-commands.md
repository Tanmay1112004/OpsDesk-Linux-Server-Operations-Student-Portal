# Linux Commands Practiced in This Project

| Goal | Command | What it tells you |
|---|---|---|
| Identity | `whoami`, `id`, `groups` | Current user, UID/GID and memberships |
| OS/kernel | `cat /etc/os-release`, `uname -a` | Distribution and kernel |
| Files | `pwd`, `ls -lah`, `find`, `du -sh` | Paths, file metadata, locations and sizes |
| Permissions | `chmod`, `chown`, `umask`, `namei -l` | Access bits, ownership and parent path permissions |
| Packages | `dnf search`, `dnf install`, `rpm -qa` | Package search, install and inventory |
| Services | `systemctl status/start/stop/restart/enable` | Service state and lifecycle |
| Logs | `journalctl -u opsdesk`, `tail -f` | Service and application troubleshooting |
| Processes | `ps aux`, `top`, `pgrep`, `kill` | Running processes and resource use |
| Networking | `ip addr`, `ip route`, `ss -tulpn`, `ping`, `curl` | Interfaces, routes, sockets and connectivity |
| Storage | `df -h`, `lsblk`, `du -sh` | Filesystem capacity and directory usage |
| Memory/load | `free -h`, `uptime` | RAM/swap and load averages |
| Automation | `bash`, `cron`, `systemd timers` | Repeatable operational tasks |
| Archive/integrity | `tar`, `gzip`, `sha256sum` | Compression and backup verification |
| Version control | `git status`, `git log`, `git diff` | Source tracking and change review |

Prefer `systemctl` for service lifecycle rather than manually killing service processes. Use `sudo` only when the operation requires elevated privileges.
