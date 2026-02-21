#!/usr/bin/env bash
set -euo pipefail

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8081/v1}"
export NEXT_PUBLIC_TENANT_ID="${NEXT_PUBLIC_TENANT_ID:-11111111-1111-1111-1111-111111111111}"
export NEXT_PUBLIC_PROPERTY_ID="${NEXT_PUBLIC_PROPERTY_ID:-22222222-2222-2222-2222-222222222222}"

export NEXT_PUBLIC_DASHBOARD_URL_PLATFORM_ADMIN="${NEXT_PUBLIC_DASHBOARD_URL_PLATFORM_ADMIN:-http://127.0.0.1:3060/tenants}"
export NEXT_PUBLIC_DASHBOARD_URL_OWNER="${NEXT_PUBLIC_DASHBOARD_URL_OWNER:-http://127.0.0.1:3050/executive-overview}"
export NEXT_PUBLIC_DASHBOARD_URL_MANAGER="${NEXT_PUBLIC_DASHBOARD_URL_MANAGER:-http://127.0.0.1:3020/ops-overview}"
export NEXT_PUBLIC_DASHBOARD_URL_FRONT_DESK="${NEXT_PUBLIC_DASHBOARD_URL_FRONT_DESK:-http://127.0.0.1:3010/today-board}"
export NEXT_PUBLIC_DASHBOARD_URL_FINANCE="${NEXT_PUBLIC_DASHBOARD_URL_FINANCE:-http://127.0.0.1:3030/finance-overview}"
export NEXT_PUBLIC_DASHBOARD_URL_HOUSEKEEPING="${NEXT_PUBLIC_DASHBOARD_URL_HOUSEKEEPING:-http://127.0.0.1:3040/task-board}"
export NEXT_PUBLIC_DASHBOARD_URL_KITCHEN="${NEXT_PUBLIC_DASHBOARD_URL_KITCHEN:-http://127.0.0.1:3080/orders}"

exec pnpm turbo run dev --parallel \
  --filter=@meshva/web-front-desk \
  --filter=@meshva/web-manager \
  --filter=@meshva/web-finance \
  --filter=@meshva/web-housekeeping \
  --filter=@meshva/web-owner \
  --filter=@meshva/web-platform-admin \
  --filter=@meshva/web-kitchen \
  --filter=@meshva/web-guest
