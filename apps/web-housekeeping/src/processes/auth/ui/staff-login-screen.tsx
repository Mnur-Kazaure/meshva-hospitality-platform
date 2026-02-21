'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { StaffLoginDto } from '../../../shared/types/contracts';
import { mapAuthErrorMessage } from '../../../shared/lib/auth/error-messages';
import { resolveStaffDashboardHref } from '../../../shared/lib/auth/role-routing';
import { loginStaff } from '../../../shared/lib/auth/session';
import { AuthLayout } from '../../../shared/ui/auth-layout';
import { staffAuthConfig } from '../config';

export function StaffLoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get('next'), [searchParams]);

  const [form, setForm] = useState<StaffLoginDto>({ identifier: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);

    try {
      const session = await loginStaff(form);
      if (session.requiresPasswordChange) {
        router.replace('/change-password');
        return;
      }

      if (nextPath && nextPath.startsWith('/')) {
        router.replace(nextPath);
        return;
      }

      router.replace(resolveStaffDashboardHref(session.roles, staffAuthConfig.defaultHomePath));
    } catch (submitError) {
      setError(mapAuthErrorMessage(submitError, 'Invalid credentials. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Staff sign in" subtitle="Sign in to your workspace.">
      <form className="grid" onSubmit={onSubmit}>
        {error ? <p className="auth-error">{error}</p> : null}

        <label className="auth-label" htmlFor="identifier">
          Email or phone
        </label>
        <input
          id="identifier"
          className="input"
          autoComplete="username"
          autoFocus
          value={form.identifier}
          onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
          required
        />

        <label className="auth-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
        />

        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="note">
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
    </AuthLayout>
  );
}
