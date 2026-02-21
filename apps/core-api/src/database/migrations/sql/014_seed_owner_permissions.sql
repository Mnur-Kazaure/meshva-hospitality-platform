-- Seed owner permission codes

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'OWNER.PORTFOLIO_VIEW', 'View tenant-wide owner KPI portfolio'),
  (gen_random_uuid(), 'OWNER.PROPERTY_VIEW', 'View property comparison tables and drill-down'),
  (gen_random_uuid(), 'OWNER.FINANCE_VIEW', 'View financial summaries and balances'),
  (gen_random_uuid(), 'OWNER.OPERATIONS_VIEW', 'View operational summaries across properties'),
  (gen_random_uuid(), 'OWNER.EXCEPTIONS_VIEW', 'View and acknowledge owner exception feed'),
  (gen_random_uuid(), 'OWNER.AUDIT_VIEW', 'View tenant-wide audit logs'),
  (gen_random_uuid(), 'OWNER.EXPORT', 'Create and download owner export jobs'),
  (gen_random_uuid(), 'OWNER.ALERTS_CONFIG', 'Manage owner alert channel preferences'),
  (gen_random_uuid(), 'OWNER.NOTE_CREATE', 'Create owner notes on exceptions')
ON CONFLICT (code) DO NOTHING;

COMMIT;
