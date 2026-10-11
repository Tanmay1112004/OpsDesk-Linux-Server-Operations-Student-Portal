#!/usr/bin/env bash
set -Eeuo pipefail

# Tested conceptually for Amazon Linux 2023 / Fedora. Review package names for your image.
if command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y git gcc-c++ make python3
else
  echo "This installer expects a DNF-based Linux distribution (Amazon Linux 2023/Fedora)." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Install a supported Node.js 20+ release for your distribution, then rerun this script."
  echo "Verify with: node --version && npm --version"
  exit 1
fi

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( node_major < 20 )); then
  echo "Node.js 20+ is required. Current version: $(node --version)" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p data logs backups
npm install
chmod 750 scripts/*.sh
echo
echo "Dependencies installed."
echo "Start locally with: npm start"
echo "Then open: http://localhost:3000"
