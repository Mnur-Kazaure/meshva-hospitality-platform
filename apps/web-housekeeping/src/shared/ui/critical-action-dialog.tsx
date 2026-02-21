'use client';

import { FormEvent, useState } from 'react';

interface CriticalActionDialogProps {
  title: string;
  description: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function CriticalActionDialog({
  title,
  description,
  open,
  onCancel,
  onConfirm,
}: CriticalActionDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim().length < 5) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 30,
      }}
    >
      <form className="card" style={{ width: 'min(520px, 92vw)', display: 'grid', gap: 12 }} onSubmit={submit}>
        <h3>{title}</h3>
        <p className="note">{description}</p>
        <label className="auth-label" htmlFor="critical-reason">
          Reason (required)
        </label>
        <textarea
          id="critical-reason"
          className="textarea"
          minLength={5}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="toolbar">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={submitting || reason.trim().length < 5}>
            {submitting ? 'Submitting...' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  );
}
