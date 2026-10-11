#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${DB_PATH:-$ROOT/data/students.db}"
BACKUP="${1:-}"

if [[ -z "$BACKUP" || ! -f "$BACKUP" ]]; then
  echo "Usage: $0 /path/to/backups/students_TIMESTAMP.db" >&2
  exit 2
fi
if [[ -f "$BACKUP.sha256" ]]; then
  (cd "$(dirname "$BACKUP")" && sha256sum -c "$(basename "$BACKUP").sha256")
fi

echo "WARNING: this replaces the current database file."
read -r -p "Type RESTORE to continue: " confirm
[[ "$confirm" == "RESTORE" ]] || { echo "Cancelled."; exit 1; }

mkdir -p "$(dirname "$DB_PATH")"
if [[ -f "$DB_PATH" ]]; then
  cp -a "$DB_PATH" "$DB_PATH.before-restore-$(date '+%Y%m%d_%H%M%S')"
fi
# Stop the application before restoring to avoid writes during replacement.
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet opsdesk 2>/dev/null; then
  echo "Stop opsdesk first, restore, then start it again:"
  echo "  sudo systemctl stop opsdesk"
  echo "  sudo systemctl start opsdesk"
  exit 1
fi
install -m 640 "$BACKUP" "$DB_PATH"
echo "Restored $BACKUP to $DB_PATH"
echo "Verify with: sqlite3 \"$DB_PATH\" 'PRAGMA integrity_check; SELECT COUNT(*) FROM students;'"
