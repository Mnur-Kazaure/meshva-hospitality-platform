#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root_dir}"

bash scripts/verify-dependency-governance.sh

source scripts/lib/registry-config.sh
runtime_npmrc="$(create_runtime_npmrc "${root_dir}" "${NPM_REGISTRY_URL}")"
trap 'rm -f "${runtime_npmrc}"' EXIT
export NPM_CONFIG_USERCONFIG="${runtime_npmrc}"

pnpm_cmd=(bash scripts/pnpmw.sh)

"${pnpm_cmd[@]}" fetch --frozen-lockfile
"${pnpm_cmd[@]}" install --offline --frozen-lockfile
