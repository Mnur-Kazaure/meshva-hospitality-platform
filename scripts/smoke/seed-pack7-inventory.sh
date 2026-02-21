#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-meshva_hospitality}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
TENANT_ID="${TENANT_ID:-11111111-1111-1111-1111-111111111111}"
PROPERTY_ID="${PROPERTY_ID:-22222222-2222-2222-2222-222222222222}"
HORIZON_DAYS="${HORIZON_DAYS:-365}"

PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -v ON_ERROR_STOP=1 <<SQL
BEGIN;

INSERT INTO inventory_calendar (
  id,
  tenant_id,
  property_id,
  room_type_id,
  date,
  available_units,
  blocked_units,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  rt.tenant_id,
  rt.property_id,
  rt.id,
  gs::date,
  rt.total_units,
  0,
  NOW(),
  NOW()
FROM room_types rt
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '${HORIZON_DAYS} days', INTERVAL '1 day') AS gs
WHERE rt.tenant_id = '${TENANT_ID}'
  AND rt.property_id = '${PROPERTY_ID}'
ON CONFLICT (tenant_id, property_id, room_type_id, date) DO NOTHING;

COMMIT;
SQL

echo "[seed-pack7-inventory] inventory horizon ensured for tenant=${TENANT_ID}, property=${PROPERTY_ID}, days=${HORIZON_DAYS}" 
