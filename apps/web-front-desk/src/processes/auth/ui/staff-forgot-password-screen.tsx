'use client';

import { FormEvent, useState } from 'react';
import { forgotStaffPassword } from '../../../shared/lib/auth/session';
import { AuthLayout } from '../../../shared/ui/auth-layout';

export function StaffForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await forgotStaffPassword({ identifier });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your account identifier. If it exists, reset instructions will be sent."
    >
      {submitted ? (
        <p className="alert">If the account exists, a reset link has been sent.</p>
      ) : (
        <form className="grid" onSubmit={onSubmit}>
          <label className="auth-label" htmlFor="identifier">
            Email or phone
          </label>
          <input
            id="identifier"
            className="input"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
