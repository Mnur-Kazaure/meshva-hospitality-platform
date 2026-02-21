#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root_dir}"

if [[ ! -f "pnpm-lock.yaml" ]]; then
  echo "ERROR: pnpm-lock.yaml is missing."
  echo "Create and commit lockfile from a trusted environment before running frozen installs."
  exit 1
fi

if [[ -z "${NPM_REGISTRY_URL:-}" ]]; then
  echo "ERROR: NPM_REGISTRY_URL is not set."
  echo "Set it to your internal npm proxy/mirror endpoint."
  exit 1
fi

if [[ "${NPM_REGISTRY_URL}" == *"registry.npmjs.org"* ]]; then
  echo "ERROR: Public npm registry is not allowed for governed builds."
  echo "Point NPM_REGISTRY_URL to your internal registry mirror."
  exit 1
fi

pnpm_cmd=(bash scripts/pnpmw.sh)
required_pnpm="$(node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));const pm=pkg.packageManager||'';if(!pm.startsWith('pnpm@'))process.exit(1);process.stdout.write(pm.slice(5));")"

if command -v node >/dev/null 2>&1; then
  required_node="$(tr -d '[:space:]' < .node-version)"
  current_node="$(node -v | sed 's/^v//')"
  if [[ "${current_node}" != "${required_node}" ]]; then
    echo "ERROR: Node version mismatch. required=${required_node} current=${current_node}"
    exit 1
  fi
fi

if ! current_pnpm="$("${pnpm_cmd[@]}" --version 2>/dev/null)"; then
  echo "ERROR: pnpm is unavailable. Install pnpm ${required_pnpm} or enable Corepack."
  exit 1
fi

if [[ "${current_pnpm}" != "${required_pnpm}" ]]; then
  echo "ERROR: pnpm version mismatch. required=${required_pnpm} current=${current_pnpm}"
  exit 1
fi

echo "Dependency governance checks passed."
