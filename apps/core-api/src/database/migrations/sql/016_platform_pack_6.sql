-- Platform Admin Console Pack #6 schema additions

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_code') THEN
    CREATE TYPE subscription_plan_code AS ENUM ('STARTER', 'STANDARD', 'PRO', 'CUSTOM');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'impersonation_status') THEN
    CREATE TYPE impersonation_status AS ENUM ('ACTIVE', 'ENDED', 'EXPIRED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY,
  code subscription_plan_code NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  property_limit int NOT NULL CHECK (property_limit >= 1),
  user_limit int NOT NULL CHECK (user_limit >= 1),
  features_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_subscription_plans_active
  ON subscription_plans(is_active, name);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  subscription_plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS ix_tenant_subscriptions_lookup
  ON tenant_subscriptions(tenant_id, status, effective_from DESC, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_subscriptions_active
  ON tenant_subscriptions(tenant_id)
  WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS tenant_feature_flags (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  key text NOT NULL,
  enabled boolean NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS ix_tenant_feature_flags_lookup
  ON tenant_feature_flags(tenant_id, key);

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  target_user_id uuid NOT NULL REFERENCES users(id),
  token text NOT NULL UNIQUE,
  status impersonation_status NOT NULL DEFAULT 'ACTIVE',
  started_by_user_id uuid NOT NULL REFERENCES users(id),
  started_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  ended_by_user_id uuid REFERENCES users(id),
  reason text,
  CHECK (expires_at > started_at)
);

CREATE INDEX IF NOT EXISTS ix_impersonation_sessions_lookup
  ON impersonation_sessions(tenant_id, target_user_id, status, started_at DESC);

COMMIT;
