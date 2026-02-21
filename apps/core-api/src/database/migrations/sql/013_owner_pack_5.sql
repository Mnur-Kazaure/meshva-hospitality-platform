-- Owner Console Pack #5 schema additions

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exception_severity') THEN
    CREATE TYPE exception_severity AS ENUM ('AMBER', 'RED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_exception_type') THEN
    CREATE TYPE owner_exception_type AS ENUM (
      'DAILY_CLOSE_VARIANCE',
      'DAY_UNLOCKED',
      'DISCOUNT_APPROVED',
      'REFUND_APPROVED',
      'REFUND_EXECUTED',
      'INVENTORY_OVERRIDDEN',
      'MULTIPLE_CANCELS_BY_USER',
      'HIGH_MANUAL_ADJUSTMENTS',
      'ROOM_STATUS_ANOMALY'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_export_type') THEN
    CREATE TYPE owner_export_type AS ENUM (
      'REVENUE_SUMMARY',
      'DAILY_CLOSE_COMPLIANCE',
      'EXCEPTIONS_LOG',
      'PAYMENTS_LEDGER',
      'OUTSTANDING_INVOICES'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_export_format') THEN
    CREATE TYPE owner_export_format AS ENUM ('CSV');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_export_status') THEN
    CREATE TYPE owner_export_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS owner_exceptions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid REFERENCES properties(id),
  type owner_exception_type NOT NULL,
  severity exception_severity NOT NULL,
  source_action text NOT NULL,
  actor_user_id uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  summary text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_by_user_id uuid REFERENCES users(id),
  acknowledged_at timestamptz,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_owner_exceptions_lookup
  ON owner_exceptions(tenant_id, property_id, type, severity, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_owner_exceptions_dedupe
  ON owner_exceptions(tenant_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS owner_notes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid REFERENCES properties(id),
  exception_id uuid NOT NULL REFERENCES owner_exceptions(id),
  text text NOT NULL CHECK (char_length(text) BETWEEN 3 AND 500),
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_owner_notes_lookup
  ON owner_notes(tenant_id, exception_id, created_at DESC);

CREATE TABLE IF NOT EXISTS owner_export_jobs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  requested_by_user_id uuid NOT NULL REFERENCES users(id),
  export_type owner_export_type NOT NULL,
  format owner_export_format NOT NULL DEFAULT 'CSV',
  from_date date NOT NULL,
  to_date date NOT NULL,
  property_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status owner_export_status NOT NULL DEFAULT 'QUEUED',
  download_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ix_owner_export_jobs_lookup
  ON owner_export_jobs(tenant_id, status, created_at DESC);

COMMIT;
