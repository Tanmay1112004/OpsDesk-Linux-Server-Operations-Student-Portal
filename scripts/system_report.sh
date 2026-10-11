#!/usr/bin/env bash
set -Eeuo pipefail
OUT="${1:-}"
report() {
  echo "=================================================="
  echo " Linux System Report - $(date '+%F %T %Z')"
  echo "=================================================="
  echo
  echo "-- Identity / OS --"
  hostname
  id
  grep -E '^(PRETTY_NAME|VERSION_ID)=' /etc/os-release 2>/dev/null || true
  uname -a
  echo
  echo "-- Uptime / load --"
  uptime
  echo
  echo "-- CPU --"
  if command -v nproc >/dev/null 2>&1; then printf "Logical CPUs: "; nproc; fi
  echo
  echo "-- Memory --"
  free -h 2>/dev/null || true
  echo
  echo "-- Filesystems --"
  df -h
  echo
  echo "-- Network addresses / routes --"
  ip -brief address 2>/dev/null || ip addr 2>/dev/null || true
  ip route 2>/dev/null || true
  echo
  echo "-- Listening TCP/UDP sockets --"
  ss -tulpn 2>/dev/null || true
  echo
  echo "-- Important services --"
  for service in opsdesk httpd nginx; do
    if systemctl list-unit-files "${service}.service" --no-legend 2>/dev/null | grep -q "${service}.service"; then
      printf "%-10s %s\n" "$service" "$(systemctl is-active "$service" 2>/dev/null || true)"
    fi
  done
  echo
  echo "-- Largest top-level log directories --"
  du -sh /var/log 2>/dev/null || true
  echo
  echo "-- Current user / permissions --"
  whoami
  umask
}
if [[ -n "$OUT" ]]; then report | tee "$OUT"; else report; fi
