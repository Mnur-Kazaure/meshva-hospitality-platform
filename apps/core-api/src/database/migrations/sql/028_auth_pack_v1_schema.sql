-- Auth Pack v1 schema authority
-- Staff + Guest identities, refresh session rotation, invite onboarding, MFA scaffolding.

BEGIN;

DO $$
BEGIN
  ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'deactivated';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'soft_deleted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_reason text,
  ADD COLUMN IF NOT EXISTS deleted_by_user_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS email_normalized text,
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_login_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

UPDATE users
SET email_normalized = CASE
    WHEN email IS NULL THEN NULL
    ELSE lower(trim(email))
  END,
  phone_e164 = CASE
    WHEN phone IS NULL THEN NULL
    ELSE regexp_replace(phone, '\\D', '', 'g')
  END
WHERE email_normalized IS NULL OR phone_e164 IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_tenant_email_normalized_active
  ON users(tenant_id, email_normalized)
  WHERE email_normalized IS NOT NULL AND status <> 'soft_deleted';

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_tenant_phone_e164_active
  ON users(tenant_id, phone_e164)
  WHERE phone_e164 IS NOT NULL AND status <> 'soft_deleted';

DO $$
BEGIN
  CREATE TYPE guest_auth_status AS ENUM ('active', 'deactivated', 'soft_deleted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS guests_auth (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  email_normalized text,
  phone text,
  phone_e164 text,
  password_hash text NOT NULL,
  status guest_auth_status NOT NULL DEFAULT 'active',
  deleted_at timestamptz,
  deleted_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_guests_auth_email_normalized_active
  ON guests_auth(email_normalized)
  WHERE email_normalized IS NOT NULL AND status <> 'soft_deleted';

CREATE UNIQUE INDEX IF NOT EXISTS ux_guests_auth_phone_e164_active
  ON guests_auth(phone_e164)
  WHERE phone_e164 IS NOT NULL AND status <> 'soft_deleted';

DO $$
BEGIN
  CREATE TYPE auth_identity_type AS ENUM ('STAFF', 'GUEST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id uuid PRIMARY KEY,
  identity_type auth_identity_type NOT NULL,
  tenant_id uuid REFERENCES tenants(id),
  user_id uuid REFERENCES users(id),
  guest_auth_id uuid REFERENCES guests_auth(id),
  token_family_id uuid NOT NULL,
  refresh_token_hash text NOT NULL UNIQUE,
  replaced_by_session_id uuid REFERENCES refresh_sessions(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason text,
  reuse_detected_at timestamptz,
  last_used_at timestamptz,
  ip text,
  user_agent text,
  CHECK (
    (user_id IS NOT NULL AND guest_auth_id IS NULL)
    OR
    (user_id IS NULL AND guest_auth_id IS NOT NULL)
  ),
  CHECK (
    (identity_type = 'STAFF' AND user_id IS NOT NULL AND tenant_id IS NOT NULL)
    OR
    (identity_type = 'GUEST' AND guest_auth_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS ix_refresh_sessions_staff_lookup
  ON refresh_sessions(identity_type, tenant_id, user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_refresh_sessions_guest_lookup
  ON refresh_sessions(identity_type, guest_auth_id, created_at DESC)
  WHERE guest_auth_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_refresh_sessions_family_lookup
  ON refresh_sessions(token_family_id, created_at DESC);

CREATE TABLE IF NOT EXISTS staff_invites (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  invite_token_hash text NOT NULL UNIQUE,
  attempt_count int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_ip text,
  accepted_user_agent text,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_staff_invites_lookup
  ON staff_invites(tenant_id, user_id, expires_at DESC);

DO $$
BEGIN
  CREATE TYPE auth_mfa_method AS ENUM ('TOTP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mfa_secrets (
  id uuid PRIMARY KEY,
  identity_type auth_identity_type NOT NULL,
  user_id uuid REFERENCES users(id),
  guest_auth_id uuid REFERENCES guests_auth(id),
  method auth_mfa_method NOT NULL DEFAULT 'TOTP',
  secret_encrypted text NOT NULL,
  enabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND guest_auth_id IS NULL)
    OR
    (user_id IS NULL AND guest_auth_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS ix_mfa_secrets_staff_lookup
  ON mfa_secrets(identity_type, user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_mfa_secrets_guest_lookup
  ON mfa_secrets(identity_type, guest_auth_id, created_at DESC)
  WHERE guest_auth_id IS NOT NULL;

COMMIT;
