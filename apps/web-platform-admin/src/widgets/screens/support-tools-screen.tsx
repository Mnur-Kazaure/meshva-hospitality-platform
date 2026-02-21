'use client';

import { useState } from 'react';
import { useStartPlatformImpersonationMutation } from '../../features/platform-tenant-actions/model/use-platform-tenant-actions';
import {
  useEndPlatformImpersonationMutation,
  useResetPlatformUserPasswordMutation,
} from '../../features/platform-support-actions/model/use-platform-support-actions';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

export default function SupportToolsPage() {
  const startImpersonationMutation = useStartPlatformImpersonationMutation();
  const endImpersonationMutation = useEndPlatformImpersonationMutation();
  const resetPasswordMutation = useResetPlatformUserPasswordMutation();

  const [tenantId, setTenantId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [startReason, setStartReason] = useState('Support session');

  const [sessionId, setSessionId] = useState('');
  const [endReason, setEndReason] = useState('Issue resolved');

  const [resetUserId, setResetUserId] = useState('');
  const [resetReason, setResetReason] = useState('Admin requested reset');

  const [feedback, setFeedback] = useState<string | null>(null);

  const onStartImpersonation = async () => {
    setFeedback(null);
    const started = await startImpersonationMutation.mutate({
      tenantId: tenantId.trim(),
      dto: {
        targetUserId: targetUserId.trim(),
        reason: startReason.trim() || undefined,
      },
    });

    if (!started) {
      return;
    }

    setSessionId(started.session.id);
    setFeedback(`Impersonation started. Session ${started.session.id}`);
  };

  const onEndImpersonation = async () => {
    setFeedback(null);
    const ended = await endImpersonationMutation.mutate({
      sessionId: sessionId.trim(),
      dto: {
        reason: endReason.trim() || undefined,
      },
    });

    if (!ended) {
      return;
    }

    setFeedback(`Impersonation ended for session ${ended.id}.`);
  };

  const onResetPassword = async () => {
    setFeedback(null);
    const reset = await resetPasswordMutation.mutate({
      userId: resetUserId.trim(),
      dto: {
        reason: resetReason.trim() || undefined,
      },
    });

    if (!reset) {
      return;
    }

    setFeedback(`Password reset forced for user ${reset.userId}.`);
  };

  const mutationError =
    startImpersonationMutation.error ??
    endImpersonationMutation.error ??
    resetPasswordMutation.error;

  return (
    <PlatformAdminShell title="Support Tools">
      {feedback ? <div className="alert">{feedback}</div> : null}
      {mutationError ? <p className="auth-error">{mutationError}</p> : null}

      <div className="grid cols-2">
        <section className="card">
          <h3>Impersonation</h3>
          <p className="note">Strictly audited. Session max 30 minutes.</p>
          <div className="form-grid">
            <label>
              Tenant ID
              <input className="input" value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
            </label>
            <label>
              Target User ID
              <input className="input" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} />
            </label>
            <label className="span-2">
              Start Reason
              <input className="input" value={startReason} onChange={(event) => setStartReason(event.target.value)} />
            </label>
            <label>
              Session ID
              <input className="input" value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
            </label>
            <label>
              End Reason
              <input className="input" value={endReason} onChange={(event) => setEndReason(event.target.value)} />
            </label>
          </div>
          <div className="toolbar">
            <button className="btn secondary" onClick={() => void onStartImpersonation()} disabled={startImpersonationMutation.isPending || !tenantId.trim() || !targetUserId.trim()}>
              {startImpersonationMutation.isPending ? 'Starting...' : 'Start Impersonation'}
            </button>
            <button className="btn secondary" onClick={() => void onEndImpersonation()} disabled={endImpersonationMutation.isPending || !sessionId.trim()}>
              {endImpersonationMutation.isPending ? 'Ending...' : 'End Session'}
            </button>
          </div>
        </section>
        <section className="card">
          <h3>User Recovery</h3>
          <div className="form-grid">
            <label>
              User ID
              <input className="input" value={resetUserId} onChange={(event) => setResetUserId(event.target.value)} />
            </label>
            <label>
              Reason
              <input className="input" value={resetReason} onChange={(event) => setResetReason(event.target.value)} />
            </label>
          </div>
          <div className="toolbar">
            <button className="btn secondary" onClick={() => void onResetPassword()} disabled={resetPasswordMutation.isPending || !resetUserId.trim()}>
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Force Password Reset'}
            </button>
          </div>
        </section>
      </div>
    </PlatformAdminShell>
  );
}
