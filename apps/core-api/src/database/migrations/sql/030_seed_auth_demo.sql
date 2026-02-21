-- Auth Pack v1 demo credentials + normalized identity fields
-- Demo password for seeded accounts: Meshva123!

BEGIN;

UPDATE users
SET email_normalized = CASE
    WHEN email IS NULL THEN NULL
    ELSE lower(trim(email))
  END,
  phone_e164 = CASE
    WHEN phone IS NULL THEN NULL
    ELSE regexp_replace(phone, '\\D', '', 'g')
  END,
  password_hash = COALESCE(password_hash, 'pbkdf2$sha512$120000$rp2G-2Vqw-NXWqQCbAe37g$zj0PVf8oMr_mOBkZWm-2PpEHjrFyPq2IDwOyrwgxbFo-o4DQ7OGCi7mRw3RuftH8-9CU7IWmkpDJzSNRqpzeTw'),
  must_change_password = false,
  password_changed_at = COALESCE(password_changed_at, NOW()),
  updated_at = NOW()
WHERE status IN ('active', 'disabled', 'deactivated');

INSERT INTO guests_auth (
  id,
  full_name,
  email,
  email_normalized,
  phone,
  phone_e164,
  password_hash,
  status,
  created_at,
  updated_at
)
VALUES
  (
    '8a000000-0000-4000-8000-000000000001',
    'Amina Yusuf',
    'amina.guest@meshva.demo',
    'amina.guest@meshva.demo',
    '+2348011111111',
    '2348011111111',
    'pbkdf2$sha512$120000$rp2G-2Vqw-NXWqQCbAe37g$zj0PVf8oMr_mOBkZWm-2PpEHjrFyPq2IDwOyrwgxbFo-o4DQ7OGCi7mRw3RuftH8-9CU7IWmkpDJzSNRqpzeTw',
    'active',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    email_normalized = EXCLUDED.email_normalized,
    phone = EXCLUDED.phone,
    phone_e164 = EXCLUDED.phone_e164,
    password_hash = EXCLUDED.password_hash,
    status = EXCLUDED.status,
    updated_at = NOW();

COMMIT;
