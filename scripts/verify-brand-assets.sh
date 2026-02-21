#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="packages/ui/assets/brand"
SVG_SOURCE="${SOURCE_DIR}/meshva-logo.svg"
PNG_SOURCE="${SOURCE_DIR}/meshva-logo.png"

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

if [[ ! -f "${SVG_SOURCE}" ]]; then
  echo "Missing source asset: ${SVG_SOURCE}" >&2
  exit 1
fi

if [[ ! -f "${PNG_SOURCE}" ]]; then
  echo "Missing source asset: ${PNG_SOURCE}" >&2
  exit 1
fi

has_errors=0

for app in "${APPS[@]}"; do
  target_dir="apps/${app}/public/brand"
  svg_target="${target_dir}/meshva-logo.svg"
  png_target="${target_dir}/meshva-logo.png"

  if [[ ! -f "${svg_target}" ]]; then
    echo "Missing synced file: ${svg_target}" >&2
    has_errors=1
  elif ! cmp -s "${SVG_SOURCE}" "${svg_target}"; then
    echo "Out-of-sync file: ${svg_target}" >&2
    has_errors=1
  fi

  if [[ ! -f "${png_target}" ]]; then
    echo "Missing synced file: ${png_target}" >&2
    has_errors=1
  elif ! cmp -s "${PNG_SOURCE}" "${png_target}"; then
    echo "Out-of-sync file: ${png_target}" >&2
    has_errors=1
  fi
done

if [[ ${has_errors} -ne 0 ]]; then
  echo
  echo "Brand assets are not synchronized. Run: pnpm brand:sync" >&2
  exit 1
fi

echo "Brand assets verified: all dashboard apps are synchronized."

