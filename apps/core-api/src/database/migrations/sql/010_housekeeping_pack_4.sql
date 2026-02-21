-- Housekeeping Dashboard Pack #4 schema extensions

BEGIN;

DO $$
BEGIN
  ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'CLEANING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'CLEAN';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'READY';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'housekeeping_task_status_v2') THEN
    CREATE TYPE housekeeping_task_status_v2 AS ENUM ('DIRTY', 'CLEANING', 'CLEAN', 'READY', 'CLOSED');
  END IF;
END $$;

ALTER TABLE housekeeping_tasks
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW();

DO $$
DECLARE
  current_type text;
BEGIN
  SELECT t.typname
  INTO current_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE c.relname = 'housekeeping_tasks'
    AND a.attname = 'status'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF current_type = 'housekeeping_task_status' THEN
    ALTER TABLE housekeeping_tasks
      ALTER COLUMN status DROP DEFAULT;

    ALTER TABLE housekeeping_tasks
      ALTER COLUMN status TYPE housekeeping_task_status_v2
      USING (
        CASE status::text
          WHEN 'OPEN' THEN 'DIRTY'
          WHEN 'IN_PROGRESS' THEN 'CLEANING'
          WHEN 'DONE' THEN 'READY'
          WHEN 'DIRTY' THEN 'DIRTY'
          WHEN 'CLEANING' THEN 'CLEANING'
          WHEN 'CLEAN' THEN 'CLEAN'
          WHEN 'READY' THEN 'READY'
          WHEN 'CLOSED' THEN 'CLOSED'
          ELSE 'DIRTY'
        END
      )::housekeeping_task_status_v2;

    DROP TYPE housekeeping_task_status;
    ALTER TYPE housekeeping_task_status_v2 RENAME TO housekeeping_task_status;
  ELSIF current_type = 'housekeeping_task_status_v2' THEN
    ALTER TYPE housekeeping_task_status_v2 RENAME TO housekeeping_task_status;
  END IF;
END $$;

ALTER TABLE housekeeping_tasks
  ALTER COLUMN status SET DEFAULT 'DIRTY';

UPDATE housekeeping_tasks
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

UPDATE housekeeping_tasks
SET completed_at = COALESCE(completed_at, updated_at, created_at)
WHERE status IN ('READY', 'CLOSED')
  AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_housekeeping_tasks_lookup
  ON housekeeping_tasks(tenant_id, property_id, status, assigned_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_housekeeping_tasks_active_room
  ON housekeeping_tasks(tenant_id, property_id, room_id)
  WHERE status IN ('DIRTY', 'CLEANING', 'CLEAN');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_ticket_status') THEN
    CREATE TYPE maintenance_ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_severity') THEN
    CREATE TYPE maintenance_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  title text NOT NULL,
  description text NOT NULL,
  severity maintenance_severity NOT NULL,
  status maintenance_ticket_status NOT NULL DEFAULT 'OPEN',
  photo_url text,
  reported_by_user_id uuid NOT NULL REFERENCES users(id),
  resolved_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS ix_maintenance_tickets_lookup
  ON maintenance_tickets(tenant_id, property_id, status, severity, created_at DESC);

COMMIT;
