'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapAuthErrorMessage } from '../../../shared/lib/auth/error-messages';
import { resetStaffPassword } from '../../../shared/lib/auth/session';
import { AuthLayout } from '../../../shared/ui/auth-layout';

export function StaffResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError('Reset link is invalid or expired.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      await resetStaffPassword({ token, newPassword });
      router.replace('/login?reset=1');
    } catch (submitError) {
      setError(mapAuthErrorMessage(submitError, 'Reset link is invalid or expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Set your new account password.">
      <form className="grid" onSubmit={onSubmit}>
        {error ? <p className="auth-error">{error}</p> : null}
        <label className="auth-label" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          className="input"
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />

        <label className="auth-label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          className="input"
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />

        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}
