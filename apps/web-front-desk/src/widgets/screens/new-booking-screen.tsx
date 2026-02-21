'use client';

import { useState } from 'react';
import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

const DRAFT_KEY = 'meshva_front_desk_booking_drafts';

interface BookingDraft {
  id: string;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  depositStatus: string;
  source: string;
  adults: number;
  notes: string;
  createdAt: string;
}

export default function NewBookingPage() {
  const [form, setForm] = useState<BookingDraft>({
    id: '',
    guestName: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    roomType: 'Standard',
    depositStatus: 'NONE',
    source: 'WALK_IN',
    adults: 1,
    notes: '',
    createdAt: '',
  });
  const [message, setMessage] = useState('');

  const update = <K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = () => {
    const currentDrafts = readDrafts();
    const draft: BookingDraft = {
      ...form,
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      notes: form.phone ? form.notes : `${form.notes}\nNO_PHONE`.trim(),
    };

    window.localStorage.setItem(DRAFT_KEY, JSON.stringify([draft, ...currentDrafts]));
    window.dispatchEvent(new Event('meshva-draft-updated'));
    setMessage('Draft saved locally. Submit when network is stable.');
  };

  const clearDrafts = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    window.dispatchEvent(new Event('meshva-draft-updated'));
    setMessage('Local draft queue cleared.');
  };

  return (
    <FrontDeskShell title="New Booking (Assisted)">
      <section className="card">
        <div className="form-grid">
          <label>
            Guest Name
            <input
              className="input"
              placeholder="Required"
              value={form.guestName}
              onChange={(event) => update('guestName', event.currentTarget.value)}
            />
          </label>
          <label>
            Phone
            <input
              className="input"
              placeholder="Optional (No phone supported)"
              value={form.phone}
              onChange={(event) => update('phone', event.currentTarget.value)}
            />
          </label>
          <label>
            Check-in
            <input
              className="input"
              type="date"
              value={form.checkIn}
              onChange={(event) => update('checkIn', event.currentTarget.value)}
            />
          </label>
          <label>
            Check-out
            <input
              className="input"
              type="date"
              value={form.checkOut}
              onChange={(event) => update('checkOut', event.currentTarget.value)}
            />
          </label>
          <label>
            Room Type
            <select
              className="select"
              value={form.roomType}
              onChange={(event) => update('roomType', event.currentTarget.value)}
            >
              <option>Standard</option>
              <option>Deluxe</option>
            </select>
          </label>
          <label>
            Deposit Status
            <select
              className="select"
              value={form.depositStatus}
              onChange={(event) => update('depositStatus', event.currentTarget.value)}
            >
              <option>NONE</option>
              <option>PROMISED</option>
              <option>PAID_AT_CASHIER</option>
            </select>
          </label>
          <label>
            Source
            <select
              className="select"
              value={form.source}
              onChange={(event) => update('source', event.currentTarget.value)}
            >
              <option>WALK_IN</option>
              <option>CALL</option>
              <option>WHATSAPP</option>
              <option>AGENT</option>
            </select>
          </label>
          <label>
            Adults
            <input
              className="input"
              type="number"
              min={1}
              value={form.adults}
              onChange={(event) => update('adults', Number(event.currentTarget.value))}
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            className="textarea"
            placeholder="NO_PHONE will be auto-tagged when phone is empty"
            value={form.notes}
            onChange={(event) => update('notes', event.currentTarget.value)}
          />
        </label>
        <div className="toolbar">
          <button className="btn secondary" type="button">
            Check Availability
          </button>
          <button className="btn secondary" type="button" onClick={saveDraft}>
            Save Offline Draft
          </button>
          <button className="btn secondary" type="button" onClick={clearDrafts}>
            Clear Draft Queue
          </button>
          <button className="btn primary" type="button">
            Create Reservation
          </button>
        </div>
        {message ? <p className="note">{message}</p> : null}
      </section>
      <div className="alert">Offline mode: drafts are queued and retried with Idempotency-Key.</div>
    </FrontDeskShell>
  );
}

function readDrafts(): BookingDraft[] {
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as BookingDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
