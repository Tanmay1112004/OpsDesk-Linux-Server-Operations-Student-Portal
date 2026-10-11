#!/usr/bin/env bash
set -u
APP_URL="${APP_URL:-http://127.0.0.1:3000}"
SERVICE_NAME="${SERVICE_NAME:-opsdesk}"
WARN_DISK_PERCENT="${WARN_DISK_PERCENT:-80}"
WARN_MEM_PERCENT="${WARN_MEM_PERCENT:-90}"
FAILED=0

ok()   { printf '\033[0;32m[ OK ]\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m[WARN]\033[0m %s\n' "$*"; }
fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$*"; FAILED=1; }

echo "=================================================="
echo " Linux OpsDesk - Host & Application Health Check"
echo "=================================================="
printf "Host: %s | Date: %s\n\n" "$(hostname)" "$(date '+%F %T %Z')"

if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then ok "systemd service $SERVICE_NAME is active"; else warn "systemd service $SERVICE_NAME is not active (local npm runs won't have this unit)"; fi

if curl --fail --silent --show-error --max-time 4 "$APP_URL/api/health" >/tmp/opsdesk-health.json 2>/dev/null; then
  ok "HTTP health endpoint responds at $APP_URL/api/health"
  cat /tmp/opsdesk-health.json; echo
else
  fail "Cannot reach $APP_URL/api/health"
fi

if command -v ss >/dev/null 2>&1; then
  if ss -lnt | grep -Eq '(:|\])3000[[:space:]]'; then ok "TCP port 3000 is listening"; else warn "No listener found on TCP port 3000"; fi
fi

disk_used="$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')"
if [[ "$disk_used" =~ ^[0-9]+$ ]]; then
  if (( disk_used >= WARN_DISK_PERCENT )); then warn "Root filesystem usage is ${disk_used}% (threshold ${WARN_DISK_PERCENT}%)"; else ok "Root filesystem usage is ${disk_used}%"; fi
fi

if command -v free >/dev/null 2>&1; then
  mem_line="$(free | awk '/^Mem:/ { if ($2>0) printf "%d", ($3/$2)*100 }')"
  if [[ "$mem_line" =~ ^[0-9]+$ ]]; then
    if (( mem_line >= WARN_MEM_PERCENT )); then warn "Memory usage is approximately ${mem_line}% (threshold ${WARN_MEM_PERCENT}%)"; else ok "Memory usage is approximately ${mem_line}%"; fi
  fi
fi

echo
echo "-- Uptime / load --"
uptime
echo
echo "-- Root filesystem --"
df -h /
echo
echo "-- Memory --"
free -h 2>/dev/null || true
echo
echo "-- Recent service logs (last 8 lines) --"
journalctl -u "$SERVICE_NAME" -n 8 --no-pager 2>/dev/null || true
rm -f /tmp/opsdesk-health.json

if (( FAILED )); then echo; fail "One or more critical checks failed."; exit 1; fi
echo
ok "Critical checks completed."
