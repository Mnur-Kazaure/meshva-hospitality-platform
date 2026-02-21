-- Front Desk Pack #1 baseline schema (multi-tenant, multi-property)
-- Safe to run in a clean Postgres database.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE property_status AS ENUM ('active', 'inactive');
CREATE TYPE user_status AS ENUM ('active', 'disabled');
CREATE TYPE auth_provider AS ENUM ('password', 'otp', 'oauth');
CREATE TYPE room_status AS ENUM ('VACANT_READY', 'OCCUPIED', 'DIRTY');
CREATE TYPE reservation_status AS ENUM ('DRAFT', 'CONFIRMED', 'PENDING_CONFIRM', 'CANCELLED', 'EXPIRED', 'NO_SHOW');
CREATE TYPE booking_source AS ENUM ('WALK_IN', 'CALL', 'WHATSAPP', 'AGENT');
CREATE TYPE deposit_status AS ENUM ('NONE', 'PROMISED', 'PAID_AT_CASHIER');
CREATE TYPE stay_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE housekeeping_task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
CREATE TYPE shift_type AS ENUM ('DAY', 'NIGHT');
CREATE TYPE confirmation_status AS ENUM ('QUEUED', 'SENT', 'FAILED');
CREATE TYPE confirmation_entity_type AS ENUM ('RESERVATION', 'STAY');

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  legal_name text,
  primary_phone text,
  primary_email text,
  country text NOT NULL DEFAULT 'NG',
  state text,
  city text,
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  status tenant_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  address text,
  state text,
  city text,
  phone text,
  email text,
  checkin_time time,
  checkout_time time,
  currency text NOT NULL DEFAULT 'NGN',
  status property_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  full_name text NOT NULL,
  phone text,
  email text,
  password_hash text,
  auth_provider auth_provider NOT NULL DEFAULT 'otp',
  status user_status NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_tenant_email ON users(tenant_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_tenant_phone ON users(tenant_id, phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  role_id uuid NOT NULL REFERENCES roles(id),
  permission_id uuid NOT NULL REFERENCES permissions(id),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role_id uuid NOT NULL REFERENCES roles(id),
  UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_property_access (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  access_level text NOT NULL DEFAULT 'operate',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  name text NOT NULL,
  total_units int NOT NULL CHECK (total_units >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, name)
);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_type_id uuid NOT NULL REFERENCES room_types(id),
  room_number text NOT NULL,
  status room_status NOT NULL DEFAULT 'VACANT_READY',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, room_number)
);

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  full_name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  code text NOT NULL,
  guest_id uuid NOT NULL REFERENCES guests(id),
  guest_full_name text NOT NULL,
  guest_phone text,
  room_type_id uuid NOT NULL REFERENCES room_types(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults int NOT NULL DEFAULT 1 CHECK (adults BETWEEN 1 AND 10),
  children int NOT NULL DEFAULT 0 CHECK (children BETWEEN 0 AND 10),
  source booking_source NOT NULL,
  notes text,
  no_phone boolean NOT NULL DEFAULT false,
  deposit_status deposit_status NOT NULL,
  status reservation_status NOT NULL,
  cancel_reason text,
  cancel_notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (check_out > check_in),
  UNIQUE (tenant_id, property_id, code)
);

CREATE INDEX IF NOT EXISTS ix_reservations_lookup
  ON reservations(tenant_id, property_id, status, check_in, check_out);

CREATE TABLE IF NOT EXISTS stays (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  reservation_id uuid NOT NULL REFERENCES reservations(id),
  guest_id uuid NOT NULL REFERENCES guests(id),
  room_id uuid REFERENCES rooms(id),
  id_number text,
  status stay_status NOT NULL,
  check_in_at timestamptz NOT NULL,
  planned_check_out date NOT NULL,
  check_out_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_stays_open_lookup ON stays(tenant_id, property_id, status, room_id);

CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  stay_id uuid NOT NULL REFERENCES stays(id),
  status housekeeping_task_status NOT NULL DEFAULT 'OPEN',
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_handover_notes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL REFERENCES users(id),
  shift_type shift_type NOT NULL,
  notes text NOT NULL,
  exceptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS confirmations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  entity_type confirmation_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  template text NOT NULL,
  channel text NOT NULL,
  to_phone text,
  language text,
  status confirmation_status NOT NULL DEFAULT 'QUEUED',
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_jobs (
  id uuid PRIMARY KEY,
  queue text NOT NULL,
  name text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid REFERENCES properties(id),
  actor_user_id uuid REFERENCES users(id),
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  before_json jsonb,
  after_json jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_lookup ON audit_logs(tenant_id, property_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  cache_key text PRIMARY KEY,
  status_code int NOT NULL,
  response_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS reservation_code_seq START 1001;

COMMIT;
