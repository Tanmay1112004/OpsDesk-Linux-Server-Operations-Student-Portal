#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${DB_PATH:-$ROOT/data/students.db}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
STAMP="$(date '+%Y%m%d_%H%M%S')"
DEST="$BACKUP_DIR/students_${STAMP}.db"

mkdir -p "$BACKUP_DIR"
if [[ ! -f "$DB_PATH" ]]; then
  echo "Database not found at: $DB_PATH" >&2
  echo "Start the app once so it can initialize the database, or set DB_PATH correctly." >&2
  exit 1
fi

# SQLite's online backup API safely snapshots a live database, including WAL mode.
node - "$DB_PATH" "$DEST" <<'NODE'
const Database = require("better-sqlite3");
const [source, destination] = process.argv.slice(2);
const db = new Database(source, { readonly: true, fileMustExist: true });
db.backup(destination).then(() => {
  db.close();
  console.log(`Database snapshot created: ${destination}`);
}).catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
  db.close();
});
NODE

test -s "$DEST"
sha256sum "$DEST" > "$DEST.sha256"
find "$BACKUP_DIR" -type f -name 'students_*.db' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'students_*.db.sha256' -mtime "+$RETENTION_DAYS" -delete
echo "Backup verified: $(du -h "$DEST" | awk '{print $1}')"
