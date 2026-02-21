-- Seed permission codes for Kitchen Pack #8

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'KITCHEN.MENU_VIEW', 'View kitchen menu categories and items'),
  (gen_random_uuid(), 'KITCHEN.MENU_MANAGE', 'Create and update menu categories/items'),
  (gen_random_uuid(), 'KITCHEN.ORDER_VIEW', 'View kitchen orders queue and history'),
  (gen_random_uuid(), 'KITCHEN.ORDER_CREATE', 'Create kitchen orders linked to open stays'),
  (gen_random_uuid(), 'KITCHEN.ORDER_MODIFY', 'Modify kitchen orders before preparation starts'),
  (gen_random_uuid(), 'KITCHEN.ORDER_UPDATE_STATUS', 'Progress kitchen order status transitions'),
  (gen_random_uuid(), 'KITCHEN.ORDER_CANCEL', 'Cancel kitchen orders in NEW or ACCEPTED state'),
  (gen_random_uuid(), 'KITCHEN.CHARGE_POST', 'Post delivered kitchen order charges to folio'),
  (gen_random_uuid(), 'KITCHEN.REPORTS_VIEW', 'View kitchen lightweight reports'),
  (gen_random_uuid(), 'MANAGER.KITCHEN_CANCEL_OVERRIDE', 'Cancel kitchen orders in IN_PREP or READY via override'),
  (gen_random_uuid(), 'MANAGER.KITCHEN_VIEW', 'View kitchen activity and reports')
ON CONFLICT (code) DO NOTHING;

COMMIT;
