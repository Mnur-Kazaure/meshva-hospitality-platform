'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mapAuthErrorMessage } from '../../../shared/lib/auth/error-messages';
import { changeStaffPassword } from '../../../shared/lib/auth/session';
import { AuthLayout } from '../../../shared/ui/auth-layout';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function StaffChangePasswordScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      await changeStaffPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      router.replace('/login?passwordChanged=1');
    } catch (submitError) {
      setError(mapAuthErrorMessage(submitError, 'Unable to change password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Change password" subtitle="For security, choose a strong password.">
      <form className="grid" onSubmit={onSubmit}>
        {error ? <p className="auth-error">{error}</p> : null}

        <label className="auth-label" htmlFor="currentPassword">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          className="input"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(event) =>
            setForm((current) => ({ ...current, currentPassword: event.target.value }))
          }
          required
        />

        <label className="auth-label" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          value={form.newPassword}
          onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
          required
        />

        <label className="auth-label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((current) => ({ ...current, confirmPassword: event.target.value }))
          }
          required
        />

        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}
