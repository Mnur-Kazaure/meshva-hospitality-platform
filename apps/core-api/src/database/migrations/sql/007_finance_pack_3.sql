-- Cashier & Finance Dashboard Pack #3 schema additions

BEGIN;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 5001;

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  invoice_number text NOT NULL,
  reservation_id uuid REFERENCES reservations(id),
  stay_id uuid REFERENCES stays(id),
  guest_id uuid REFERENCES guests(id),
  issued_on date NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS ix_invoices_lookup
  ON invoices(tenant_id, property_id, status, issued_on DESC);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  method text NOT NULL CHECK (method IN ('CASH', 'BANK_TRANSFER', 'POS')),
  amount numeric(12,2) NOT NULL CHECK (amount <> 0),
  payment_type text NOT NULL CHECK (payment_type IN ('PAYMENT', 'REFUND')),
  status text NOT NULL CHECK (status IN ('RECORDED', 'REVERSED')),
  reference text,
  note text,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_payments_lookup
  ON payments(tenant_id, property_id, invoice_id, created_at DESC);

CREATE TABLE IF NOT EXISTS refund_executions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  refund_request_id uuid NOT NULL REFERENCES refund_requests(id),
  payment_id uuid NOT NULL REFERENCES payments(id),
  method text NOT NULL CHECK (method IN ('CASH', 'BANK_TRANSFER', 'POS')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  reference text,
  note text,
  executed_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, refund_request_id)
);

CREATE INDEX IF NOT EXISTS ix_refund_executions_lookup
  ON refund_executions(tenant_id, property_id, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_close_reports (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('OPEN', 'LOCKED')),
  expected_cash numeric(12,2) NOT NULL,
  expected_transfer numeric(12,2) NOT NULL,
  expected_pos numeric(12,2) NOT NULL,
  counted_cash numeric(12,2) NOT NULL,
  counted_transfer numeric(12,2) NOT NULL,
  counted_pos numeric(12,2) NOT NULL,
  variance_cash numeric(12,2) NOT NULL,
  variance_transfer numeric(12,2) NOT NULL,
  variance_pos numeric(12,2) NOT NULL,
  note text,
  closed_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, date)
);

CREATE INDEX IF NOT EXISTS ix_daily_close_reports_lookup
  ON daily_close_reports(tenant_id, property_id, date DESC);

CREATE TABLE IF NOT EXISTS finance_shift_handovers (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL REFERENCES users(id),
  shift_type shift_type NOT NULL,
  cash_on_hand numeric(12,2) NOT NULL CHECK (cash_on_hand >= 0),
  pending_refunds numeric(12,2) NOT NULL DEFAULT 0 CHECK (pending_refunds >= 0),
  notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_finance_shift_handovers_lookup
  ON finance_shift_handovers(tenant_id, property_id, created_at DESC);

ALTER TABLE folio_line_items
  ADD COLUMN IF NOT EXISTS invoice_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_folio_line_items_invoice'
  ) THEN
    ALTER TABLE folio_line_items
      ADD CONSTRAINT fk_folio_line_items_invoice
      FOREIGN KEY (invoice_id) REFERENCES invoices(id);
  END IF;
END $$;

ALTER TABLE folio_line_items
  DROP CONSTRAINT IF EXISTS folio_line_items_line_type_check;

ALTER TABLE folio_line_items
  ADD CONSTRAINT folio_line_items_line_type_check
  CHECK (line_type IN ('CHARGE', 'ADJUSTMENT', 'DISCOUNT', 'KITCHEN_CHARGE'));

CREATE INDEX IF NOT EXISTS ix_folio_line_items_invoice_lookup
  ON folio_line_items(tenant_id, property_id, invoice_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_refund_requests_invoice'
  ) THEN
    ALTER TABLE refund_requests
      ADD CONSTRAINT fk_refund_requests_invoice
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) NOT VALID;
  END IF;
END $$;

COMMIT;
