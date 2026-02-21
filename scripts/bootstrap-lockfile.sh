#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root_dir}"

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

required_node="$(tr -d '[:space:]' < .node-version)"
current_node="$(node -v | sed 's/^v//')"
if [[ "${current_node}" != "${required_node}" ]]; then
  echo "ERROR: Node version mismatch. required=${required_node} current=${current_node}"
  exit 1
fi

source scripts/lib/registry-config.sh
runtime_npmrc="$(create_runtime_npmrc "${root_dir}" "${NPM_REGISTRY_URL}")"
trap 'rm -f "${runtime_npmrc}"' EXIT
export NPM_CONFIG_USERCONFIG="${runtime_npmrc}"

pnpm_cmd=(bash scripts/pnpmw.sh)

"${pnpm_cmd[@]}" install --lockfile-only --ignore-scripts

echo "Lockfile bootstrap completed."
echo "Commit pnpm-lock.yaml before running frozen/offline installs."
