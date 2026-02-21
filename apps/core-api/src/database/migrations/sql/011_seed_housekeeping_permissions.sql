-- Seed housekeeping + maintenance permission codes

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'HOUSEKEEPING.TASK_VIEW', 'View housekeeping tasks and room status board'),
  (gen_random_uuid(), 'HOUSEKEEPING.TASK_UPDATE', 'Progress housekeeping task state transitions'),
  (gen_random_uuid(), 'HOUSEKEEPING.MAINTENANCE_CREATE', 'Create maintenance tickets from housekeeping workflow'),
  (gen_random_uuid(), 'HOUSEKEEPING.MAINTENANCE_VIEW', 'View maintenance ticket backlog and history'),
  (gen_random_uuid(), 'MANAGER.HOUSEKEEPING_ASSIGN', 'Assign housekeeping tasks to staff users'),
  (gen_random_uuid(), 'MANAGER.MAINTENANCE_VIEW', 'View maintenance tickets and escalations')
ON CONFLICT (code) DO NOTHING;

COMMIT;
