-- Seed finance permission codes

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'FINANCE.PAYMENT_RECORD', 'Record property payments and folio adjustments'),
  (gen_random_uuid(), 'FINANCE.PAYMENT_VIEW', 'View invoices, payments, refunds, and daily close status'),
  (gen_random_uuid(), 'FINANCE.REFUND_EXECUTE', 'Execute manager-approved refunds'),
  (gen_random_uuid(), 'FINANCE.DAILY_CLOSE', 'Perform daily close and lock financial day'),
  (gen_random_uuid(), 'FINANCE.REPORT_VIEW', 'View finance overview and daily totals'),
  (gen_random_uuid(), 'FINANCE.SHIFT_HANDOVER_CREATE', 'Submit finance shift handover')
ON CONFLICT (code) DO NOTHING;

COMMIT;
