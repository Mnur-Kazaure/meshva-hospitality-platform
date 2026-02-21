-- Normalize seeded room type IDs to RFC4122 v4-compatible UUIDs.
-- This keeps strict @IsUUID() DTO validation while preserving existing seeded data.

BEGIN;

-- Ensure child table foreign keys allow parent room_type id updates to cascade safely.
ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_room_type_id_fkey,
  ADD CONSTRAINT rooms_room_type_id_fkey
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON UPDATE CASCADE;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_room_type_id_fkey,
  ADD CONSTRAINT reservations_room_type_id_fkey
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON UPDATE CASCADE;

ALTER TABLE rate_plans
  DROP CONSTRAINT IF EXISTS rate_plans_room_type_id_fkey,
  ADD CONSTRAINT rate_plans_room_type_id_fkey
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON UPDATE CASCADE;

ALTER TABLE inventory_blocks
  DROP CONSTRAINT IF EXISTS inventory_blocks_room_type_id_fkey,
  ADD CONSTRAINT inventory_blocks_room_type_id_fkey
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON UPDATE CASCADE;

ALTER TABLE inventory_overrides
  DROP CONSTRAINT IF EXISTS inventory_overrides_room_type_id_fkey,
  ADD CONSTRAINT inventory_overrides_room_type_id_fkey
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON UPDATE CASCADE;

DO $$
BEGIN
  -- Standard room type (primary property)
  IF EXISTS (SELECT 1 FROM room_types WHERE id = '33333333-3333-3333-3333-333333333333') THEN
    IF EXISTS (SELECT 1 FROM room_types WHERE id = '33333333-3333-4333-8333-333333333333') THEN
      UPDATE rooms
      SET room_type_id = '33333333-3333-4333-8333-333333333333'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333333';

      UPDATE reservations
      SET room_type_id = '33333333-3333-4333-8333-333333333333'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333333';

      UPDATE rate_plans
      SET room_type_id = '33333333-3333-4333-8333-333333333333'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333333';

      UPDATE inventory_blocks
      SET room_type_id = '33333333-3333-4333-8333-333333333333'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333333';

      UPDATE inventory_overrides
      SET room_type_id = '33333333-3333-4333-8333-333333333333'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333333';

      DELETE FROM room_types
      WHERE id = '33333333-3333-3333-3333-333333333333';
    ELSE
      UPDATE room_types
      SET id = '33333333-3333-4333-8333-333333333333'
      WHERE id = '33333333-3333-3333-3333-333333333333';
    END IF;
  END IF;

  -- Deluxe room type (primary property)
  IF EXISTS (SELECT 1 FROM room_types WHERE id = '44444444-4444-4444-4444-444444444444') THEN
    IF EXISTS (SELECT 1 FROM room_types WHERE id = '44444444-4444-4444-8444-444444444444') THEN
      UPDATE rooms
      SET room_type_id = '44444444-4444-4444-8444-444444444444'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444444';

      UPDATE reservations
      SET room_type_id = '44444444-4444-4444-8444-444444444444'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444444';

      UPDATE rate_plans
      SET room_type_id = '44444444-4444-4444-8444-444444444444'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444444';

      UPDATE inventory_blocks
      SET room_type_id = '44444444-4444-4444-8444-444444444444'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444444';

      UPDATE inventory_overrides
      SET room_type_id = '44444444-4444-4444-8444-444444444444'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444444';

      DELETE FROM room_types
      WHERE id = '44444444-4444-4444-4444-444444444444';
    ELSE
      UPDATE room_types
      SET id = '44444444-4444-4444-8444-444444444444'
      WHERE id = '44444444-4444-4444-4444-444444444444';
    END IF;
  END IF;

  -- Standard room type (secondary property / owner demo)
  IF EXISTS (SELECT 1 FROM room_types WHERE id = '33333333-3333-3333-3333-333333333334') THEN
    IF EXISTS (SELECT 1 FROM room_types WHERE id = '33333333-3333-4333-8333-333333333334') THEN
      UPDATE rooms
      SET room_type_id = '33333333-3333-4333-8333-333333333334'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333334';

      UPDATE reservations
      SET room_type_id = '33333333-3333-4333-8333-333333333334'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333334';

      UPDATE rate_plans
      SET room_type_id = '33333333-3333-4333-8333-333333333334'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333334';

      UPDATE inventory_blocks
      SET room_type_id = '33333333-3333-4333-8333-333333333334'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333334';

      UPDATE inventory_overrides
      SET room_type_id = '33333333-3333-4333-8333-333333333334'
      WHERE room_type_id = '33333333-3333-3333-3333-333333333334';

      DELETE FROM room_types
      WHERE id = '33333333-3333-3333-3333-333333333334';
    ELSE
      UPDATE room_types
      SET id = '33333333-3333-4333-8333-333333333334'
      WHERE id = '33333333-3333-3333-3333-333333333334';
    END IF;
  END IF;

  -- Deluxe room type (secondary property / owner demo)
  IF EXISTS (SELECT 1 FROM room_types WHERE id = '44444444-4444-4444-4444-444444444445') THEN
    IF EXISTS (SELECT 1 FROM room_types WHERE id = '44444444-4444-4444-8444-444444444445') THEN
      UPDATE rooms
      SET room_type_id = '44444444-4444-4444-8444-444444444445'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444445';

      UPDATE reservations
      SET room_type_id = '44444444-4444-4444-8444-444444444445'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444445';

      UPDATE rate_plans
      SET room_type_id = '44444444-4444-4444-8444-444444444445'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444445';

      UPDATE inventory_blocks
      SET room_type_id = '44444444-4444-4444-8444-444444444445'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444445';

      UPDATE inventory_overrides
      SET room_type_id = '44444444-4444-4444-8444-444444444445'
      WHERE room_type_id = '44444444-4444-4444-4444-444444444445';

      DELETE FROM room_types
      WHERE id = '44444444-4444-4444-4444-444444444445';
    ELSE
      UPDATE room_types
      SET id = '44444444-4444-4444-8444-444444444445'
      WHERE id = '44444444-4444-4444-4444-444444444445';
    END IF;
  END IF;
END $$;

COMMIT;
