#!/usr/bin/env bash
set -euo pipefail

create_runtime_npmrc() {
  local root_dir="$1"
  local registry_url="$2"
  local runtime_npmrc registry_host

  runtime_npmrc="$(mktemp "${root_dir}/.npmrc.runtime.XXXXXX")"
  registry_host="${NPM_REGISTRY_HOST:-${registry_url#*://}}"
  registry_host="${registry_host%/}/"

  cat >"${runtime_npmrc}" <<EOF
registry=${registry_url}
@meshva:registry=${registry_url}
always-auth=true
strict-ssl=true
engine-strict=true
prefer-offline=true
fetch-retries=2
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
EOF

  if [[ -n "${NPM_TOKEN:-}" ]]; then
    printf "//%s:_authToken=%s\n" "${registry_host}" "${NPM_TOKEN}" >>"${runtime_npmrc}"
  fi

  echo "${runtime_npmrc}"
}
