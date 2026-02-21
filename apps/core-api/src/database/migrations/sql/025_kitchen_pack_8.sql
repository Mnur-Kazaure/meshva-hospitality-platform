-- Kitchen & Restaurant Dashboard Pack #8 schema additions

BEGIN;

CREATE SEQUENCE IF NOT EXISTS kitchen_order_code_seq START 1001;

CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  name text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  updated_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_menu_categories_scope_key
  ON menu_categories(tenant_id, property_id, id);

CREATE INDEX IF NOT EXISTS ix_menu_categories_lookup
  ON menu_categories(tenant_id, property_id, created_at DESC);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  category_id uuid NOT NULL REFERENCES menu_categories(id),
  name text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  description text,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  updated_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, category_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_menu_items_scope_key
  ON menu_items(tenant_id, property_id, id);

CREATE INDEX IF NOT EXISTS ix_menu_items_lookup
  ON menu_items(tenant_id, property_id, active, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_menu_items_category_scope') THEN
    ALTER TABLE menu_items
      ADD CONSTRAINT fk_menu_items_category_scope
      FOREIGN KEY (tenant_id, property_id, category_id)
      REFERENCES menu_categories(tenant_id, property_id, id)
      NOT VALID;
  END IF;
END $$;

ALTER TABLE folio_line_items
  ADD COLUMN IF NOT EXISTS reference_order_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS ux_folio_line_items_scope_key
  ON folio_line_items(tenant_id, property_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_folio_line_items_reference_order
  ON folio_line_items(tenant_id, property_id, reference_order_id)
  WHERE reference_order_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS kitchen_orders (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  code text NOT NULL,
  stay_id uuid NOT NULL REFERENCES stays(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  status text NOT NULL CHECK (
    status IN (
      'NEW',
      'ACCEPTED',
      'IN_PREP',
      'READY',
      'DELIVERED',
      'CANCELLED',
      'CANCELLED_WITH_REASON'
    )
  ),
  notes text,
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  charge_posted_at timestamptz,
  charge_folio_line_item_id uuid REFERENCES folio_line_items(id),
  cancelled_reason text,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  updated_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, code)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_kitchen_orders_scope_key
  ON kitchen_orders(tenant_id, property_id, id);

CREATE INDEX IF NOT EXISTS ix_kitchen_orders_lookup
  ON kitchen_orders(tenant_id, property_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_kitchen_orders_stay_lookup
  ON kitchen_orders(tenant_id, property_id, stay_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_kitchen_orders_stays_scope') THEN
    ALTER TABLE kitchen_orders
      ADD CONSTRAINT fk_kitchen_orders_stays_scope
      FOREIGN KEY (tenant_id, property_id, stay_id)
      REFERENCES stays(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_kitchen_orders_rooms_scope') THEN
    ALTER TABLE kitchen_orders
      ADD CONSTRAINT fk_kitchen_orders_rooms_scope
      FOREIGN KEY (tenant_id, property_id, room_id)
      REFERENCES rooms(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_kitchen_orders_charge_folio_scope'
  ) THEN
    ALTER TABLE kitchen_orders
      ADD CONSTRAINT fk_kitchen_orders_charge_folio_scope
      FOREIGN KEY (tenant_id, property_id, charge_folio_line_item_id)
      REFERENCES folio_line_items(tenant_id, property_id, id)
      NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_folio_reference_order_scope') THEN
    ALTER TABLE folio_line_items
      ADD CONSTRAINT fk_folio_reference_order_scope
      FOREIGN KEY (tenant_id, property_id, reference_order_id)
      REFERENCES kitchen_orders(tenant_id, property_id, id)
      NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS kitchen_order_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  order_id uuid NOT NULL REFERENCES kitchen_orders(id),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  menu_item_name text NOT NULL,
  quantity int NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  item_note text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_kitchen_order_items_order_lookup
  ON kitchen_order_items(tenant_id, property_id, order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_kitchen_order_items_menu_lookup
  ON kitchen_order_items(tenant_id, property_id, menu_item_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_kitchen_order_items_order_scope') THEN
    ALTER TABLE kitchen_order_items
      ADD CONSTRAINT fk_kitchen_order_items_order_scope
      FOREIGN KEY (tenant_id, property_id, order_id)
      REFERENCES kitchen_orders(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_kitchen_order_items_menu_item_scope'
  ) THEN
    ALTER TABLE kitchen_order_items
      ADD CONSTRAINT fk_kitchen_order_items_menu_item_scope
      FOREIGN KEY (tenant_id, property_id, menu_item_id)
      REFERENCES menu_items(tenant_id, property_id, id)
      NOT VALID;
  END IF;
END $$;

COMMIT;
