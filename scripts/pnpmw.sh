#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root_dir}"

required_pnpm="${PNPM_VERSION:-$(node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));const pm=pkg.packageManager||'';if(!pm.startsWith('pnpm@'))process.exit(1);process.stdout.write(pm.slice(5));")}"
export COREPACK_HOME="${COREPACK_HOME:-${root_dir}/.cache/corepack}"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

mkdir -p "${COREPACK_HOME}"

seed_dest="${COREPACK_HOME}/v1/pnpm/${required_pnpm}"
if [[ ! -d "${seed_dest}" ]]; then
  fallback_home="${COREPACK_FALLBACK_HOME:-${HOME:-}/.cache/node/corepack}"
  seed_src="${fallback_home}/v1/pnpm/${required_pnpm}"
  if [[ -d "${seed_src}" ]]; then
    mkdir -p "$(dirname "${seed_dest}")"
    cp -R "${seed_src}" "${seed_dest}"
  fi
fi

if command -v corepack >/dev/null 2>&1; then
  if [[ ! -d "${seed_dest}" ]]; then
    corepack prepare "pnpm@${required_pnpm}" --activate >/dev/null
  fi
  exec corepack pnpm "$@"
fi

if command -v pnpm >/dev/null 2>&1; then
  exec pnpm "$@"
fi

echo "ERROR: pnpm is not available and corepack is not installed."
exit 1
