'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GuestLoginDto, GuestRegisterDto } from '../../../shared/types/contracts';
import { mapAuthErrorMessage } from '../../../shared/lib/auth/error-messages';
import { loginGuest, registerGuest } from '../../../shared/lib/auth/session';
import { AuthLayout } from '../../../shared/ui/auth-layout';

type AuthMode = 'login' | 'register';

interface GuestLoginScreenProps {
  initialMode?: AuthMode;
}

export function GuestLoginScreen({ initialMode = 'login' }: GuestLoginScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get('next'), [searchParams]);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginForm, setLoginForm] = useState<GuestLoginDto>({
    identifier: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState<GuestRegisterDto>({
    fullName: '',
    identifier: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);

    try {
      if (mode === 'login') {
        await loginGuest(loginForm);
      } else {
        await registerGuest(registerForm);
      }

      if (nextPath && nextPath.startsWith('/')) {
        router.replace(nextPath);
        return;
      }

      router.replace('/my-bookings');
    } catch (submitError) {
      setError(mapAuthErrorMessage(submitError, 'Unable to complete sign in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={mode === 'login' ? 'Guest sign in' : 'Create guest account'}
      subtitle="Sign in to manage bookings."
    >
      <form className="grid" onSubmit={onSubmit}>
        {error ? <p className="auth-error">{error}</p> : null}

        <div className="toolbar">
          <button
            className={`btn ${mode === 'login' ? 'primary' : 'secondary'}`}
            type="button"
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            className={`btn ${mode === 'register' ? 'primary' : 'secondary'}`}
            type="button"
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        {mode === 'register' ? (
          <>
            <label className="auth-label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              className="input"
              value={registerForm.fullName}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, fullName: event.target.value }))
              }
              required
            />
          </>
        ) : null}

        <label className="auth-label" htmlFor="identifier">
          Email or phone
        </label>
        <input
          id="identifier"
          className="input"
          autoComplete="username"
          value={mode === 'login' ? loginForm.identifier : registerForm.identifier}
          onChange={(event) => {
            const value = event.target.value;
            if (mode === 'login') {
              setLoginForm((current) => ({ ...current, identifier: value }));
              return;
            }
            setRegisterForm((current) => ({ ...current, identifier: value }));
          }}
          required
        />

        <label className="auth-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={8}
          value={mode === 'login' ? loginForm.password : registerForm.password}
          onChange={(event) => {
            const value = event.target.value;
            if (mode === 'login') {
              setLoginForm((current) => ({ ...current, password: value }));
              return;
            }
            setRegisterForm((current) => ({ ...current, password: value }));
          }}
          required
        />

        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <p className="note">
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
    </AuthLayout>
  );
}
