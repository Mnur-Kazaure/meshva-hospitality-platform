-- Seed Manager + approval permission codes

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'FRONT_DESK.DISCOUNT_REQUEST', 'Create discount approval request'),
  (gen_random_uuid(), 'FRONT_DESK.REFUND_REQUEST', 'Create refund approval request'),
  (gen_random_uuid(), 'FRONT_DESK.OVERRIDE_REQUEST', 'Create override approval request'),
  (gen_random_uuid(), 'MANAGER.OPS_VIEW', 'View manager operations overview'),
  (gen_random_uuid(), 'MANAGER.APPROVAL_VIEW', 'View approval request queues'),
  (gen_random_uuid(), 'MANAGER.DISCOUNT_APPROVE', 'Approve or reject discount requests'),
  (gen_random_uuid(), 'MANAGER.REFUND_APPROVE', 'Approve or reject refund requests'),
  (gen_random_uuid(), 'MANAGER.OVERRIDE_APPROVE', 'Approve or reject override requests'),
  (gen_random_uuid(), 'MANAGER.RATEPLAN_MANAGE', 'Create and update rate plans'),
  (gen_random_uuid(), 'MANAGER.INVENTORY_MANAGE', 'Manage inventory calendar blocks and overrides'),
  (gen_random_uuid(), 'MANAGER.RESERVATION_OVERRIDE', 'Confirm pending reservations and force cancel'),
  (gen_random_uuid(), 'MANAGER.NOSHOW_FINALIZE', 'Finalize no-show reservations'),
  (gen_random_uuid(), 'MANAGER.STAFF_ACTIVITY_VIEW', 'View staff activity and audit timeline'),
  (gen_random_uuid(), 'MANAGER.PROPERTY_SETTINGS_EDIT', 'Edit property settings within policy'),
  (gen_random_uuid(), 'MANAGER.DAY_UNLOCK', 'Unlock day after daily close lock')
ON CONFLICT (code) DO NOTHING;

COMMIT;
