'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapAuthErrorMessage } from '../../../shared/lib/auth/error-messages';
import { acceptStaffInvite } from '../../../shared/lib/auth/session';
import { resolveStaffDashboardHref } from '../../../shared/lib/auth/role-routing';
import { AuthLayout } from '../../../shared/ui/auth-layout';
import { staffAuthConfig } from '../config';

export function StaffInviteAcceptScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError('Invitation link is invalid or expired.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const session = await acceptStaffInvite({
        token,
        newPassword,
        fullName: fullName.trim() || undefined,
      });

      if (session.requiresPasswordChange) {
        router.replace('/change-password');
        return;
      }

      router.replace(resolveStaffDashboardHref(session.roles, staffAuthConfig.defaultHomePath));
    } catch (submitError) {
      setError(mapAuthErrorMessage(submitError, 'Invitation link is invalid or expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Activate account" subtitle="Set your password to activate your staff account.">
      <form className="grid" onSubmit={onSubmit}>
        {error ? <p className="auth-error">{error}</p> : null}

        <label className="auth-label" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className="input"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />

        <label className="auth-label" htmlFor="newPassword">
          Password
        </label>
        <input
          id="newPassword"
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />

        <label className="auth-label" htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />

        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Activating...' : 'Activate account'}
        </button>
      </form>
    </AuthLayout>
  );
}
