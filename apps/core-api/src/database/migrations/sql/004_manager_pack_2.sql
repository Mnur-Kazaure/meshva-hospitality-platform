-- Manager Console Pack #2 schema additions

BEGIN;

CREATE TABLE IF NOT EXISTS rate_plans (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_type_id uuid NOT NULL REFERENCES room_types(id),
  name text NOT NULL,
  base_rate numeric(12,2) NOT NULL CHECK (base_rate >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS ix_rate_plans_lookup
  ON rate_plans(tenant_id, property_id, room_type_id, effective_from);

CREATE TABLE IF NOT EXISTS discount_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  entity_type text NOT NULL CHECK (entity_type IN ('RESERVATION', 'STAY')),
  entity_id uuid NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('AMOUNT', 'PERCENT')),
  value numeric(12,2) NOT NULL CHECK (value > 0),
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED')),
  requested_by_user_id uuid NOT NULL REFERENCES users(id),
  approved_by_user_id uuid REFERENCES users(id),
  rejected_by_user_id uuid REFERENCES users(id),
  note text,
  rejection_reason text,
  applied_line_item_id uuid,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_discount_requests_lookup
  ON discount_requests(tenant_id, property_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  invoice_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED')),
  requested_by_user_id uuid NOT NULL REFERENCES users(id),
  approved_by_user_id uuid REFERENCES users(id),
  rejected_by_user_id uuid REFERENCES users(id),
  note text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_refund_requests_lookup
  ON refund_requests(tenant_id, property_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS override_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  override_type text NOT NULL CHECK (override_type IN ('OVERBOOK', 'EXTEND_CONFLICT', 'RATE_OVERRIDE')),
  entity_type text NOT NULL CHECK (entity_type IN ('RESERVATION', 'STAY', 'INVENTORY')),
  entity_id uuid NOT NULL,
  reason text NOT NULL,
  requested_value jsonb,
  status text NOT NULL CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED')),
  requested_by_user_id uuid NOT NULL REFERENCES users(id),
  approved_by_user_id uuid REFERENCES users(id),
  rejected_by_user_id uuid REFERENCES users(id),
  note text,
  rejection_reason text,
  override_token uuid,
  override_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_override_requests_lookup
  ON override_requests(tenant_id, property_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS folio_line_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  entity_type text NOT NULL CHECK (entity_type IN ('RESERVATION', 'STAY')),
  entity_id uuid NOT NULL,
  line_type text NOT NULL CHECK (line_type IN ('DISCOUNT')),
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  description text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_folio_line_items_lookup
  ON folio_line_items(tenant_id, property_id, entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inventory_blocks (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_type_id uuid NOT NULL REFERENCES room_types(id),
  from_date date NOT NULL,
  to_date date NOT NULL,
  units_blocked int NOT NULL CHECK (units_blocked >= 1),
  reason text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS ix_inventory_blocks_lookup
  ON inventory_blocks(tenant_id, property_id, room_type_id, from_date, to_date);

CREATE TABLE IF NOT EXISTS inventory_overrides (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_type_id uuid NOT NULL REFERENCES room_types(id),
  date date NOT NULL,
  new_available_units int NOT NULL CHECK (new_available_units >= 0),
  reason text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_inventory_overrides_lookup
  ON inventory_overrides(tenant_id, property_id, room_type_id, date);

CREATE TABLE IF NOT EXISTS day_controls (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  date date NOT NULL,
  is_locked boolean NOT NULL DEFAULT true,
  unlocked_by_user_id uuid REFERENCES users(id),
  unlock_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, date)
);

CREATE INDEX IF NOT EXISTS ix_day_controls_lookup
  ON day_controls(tenant_id, property_id, date);

COMMIT;
