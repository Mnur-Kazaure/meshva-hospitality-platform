-- Phase 2 Day-1 onboarding support:
-- add MANUAL_IMPORT booking source enum for CSV import operations.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'booking_source'
      AND e.enumlabel = 'MANUAL_IMPORT'
  ) THEN
    ALTER TYPE booking_source ADD VALUE 'MANUAL_IMPORT';
  END IF;
END $$;

-- Allow onboarding housekeeping tasks for DIRTY rooms captured from legacy systems
-- where an active stay record does not yet exist in Meshva.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'housekeeping_tasks'
      AND a.attname = 'stay_id'
      AND a.attnotnull = TRUE
  ) THEN
    ALTER TABLE housekeeping_tasks
      ALTER COLUMN stay_id DROP NOT NULL;
  END IF;
END $$;
