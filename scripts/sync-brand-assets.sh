#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="packages/ui/assets/brand"
SVG_FILE="${SOURCE_DIR}/meshva-logo.svg"
PNG_FILE="${SOURCE_DIR}/meshva-logo.png"

if [[ ! -f "${SVG_FILE}" ]]; then
  echo "Missing required asset: ${SVG_FILE}" >&2
  exit 1
fi

if [[ ! -f "${PNG_FILE}" ]]; then
  echo "Missing required asset: ${PNG_FILE}" >&2
  exit 1
fi

APPS=(
  "web-front-desk"
  "web-manager"
  "web-finance"
  "web-housekeeping"
  "web-owner"
  "web-platform-admin"
  "web-guest"
  "web-kitchen"
)

for app in "${APPS[@]}"; do
  target_dir="apps/${app}/public/brand"
  mkdir -p "${target_dir}"
  cp "${SVG_FILE}" "${target_dir}/meshva-logo.svg"
  cp "${PNG_FILE}" "${target_dir}/meshva-logo.png"
  echo "Synced brand assets -> ${target_dir}"
done

