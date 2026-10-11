#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${LOG_DIR:-$ROOT/logs}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -d "$LOG_DIR" ]]; then
  echo "Log directory does not exist: $LOG_DIR"
  exit 0
fi

echo "Log directory: $LOG_DIR"
echo "Retention: $RETENTION_DAYS days"
find "$LOG_DIR" -type f -name '*.log.*' -mtime "+$RETENTION_DAYS" -print -delete
echo "Cleanup complete. Current usage:"
du -sh "$LOG_DIR"
