'use client';

import { FormEvent, useState } from 'react';
import { MaintenanceSeverity, MaintenanceTicketStatus, type CreateMaintenanceTicketDto } from '../../shared/types/contracts';
import { formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useRoomStatusBoardQuery } from '../../entities/housekeeping/model/use-room-status-board-query';
import { useMaintenanceTicketsQuery } from '../../entities/maintenance/model/use-maintenance-tickets-query';
import { useMaintenanceCreateMutation } from '../../features/maintenance-create/model/use-maintenance-create';
import { HousekeepingShell } from '../dashboard-shell/ui/housekeeping-shell';

const severities: MaintenanceSeverity[] = [
  MaintenanceSeverity.LOW,
  MaintenanceSeverity.MEDIUM,
  MaintenanceSeverity.HIGH,
];

export default function MaintenanceReportsPage() {
  const { selectedPropertyId } = useStaffSession();
  const roomBoardQuery = useRoomStatusBoardQuery(selectedPropertyId);
  const ticketsQuery = useMaintenanceTicketsQuery(selectedPropertyId, {
    status: MaintenanceTicketStatus.OPEN,
  });
  const createMutation = useMaintenanceCreateMutation();

  const [roomId, setRoomId] = useState('');
  const [severity, setSeverity] = useState<MaintenanceSeverity>(MaintenanceSeverity.MEDIUM);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    if (!selectedPropertyId || !roomId.trim()) {
      return;
    }

    const dto: CreateMaintenanceTicketDto = {
      roomId: roomId.trim(),
      severity,
      title: title.trim(),
      description: description.trim(),
      photoUrl: photoUrl.trim() || undefined,
    };

    const created = await createMutation.mutate({ propertyId: selectedPropertyId, dto });
    if (!created) {
      return;
    }

    setSuccess(`Ticket ${created.id} created for room ${created.roomId}.`);
    setTitle('');
    setDescription('');
    setPhotoUrl('');
    await ticketsQuery.refetch();
  };

  return (
    <HousekeepingShell title="Maintenance Reports">
      <div className="grid cols-2">
        <section className="card">
          <h3>New Maintenance Ticket</h3>
          {!selectedPropertyId ? <p className="auth-error">Select a property to create tickets.</p> : null}
          {success ? <div className="alert">{success}</div> : null}
          {createMutation.error ? <p className="auth-error">{createMutation.error}</p> : null}

          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Room
              <select className="select" value={roomId} onChange={(event) => setRoomId(event.target.value)} required>
                <option value="">Select room</option>
                {roomBoardQuery.data.map((room) => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.roomNumber} ({room.roomType ?? 'Room'})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Severity
              <select
                className="select"
                value={severity}
                onChange={(event) => setSeverity(event.target.value as MaintenanceSeverity)}
              >
                {severities.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              Title
              <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} maxLength={100} />
            </label>
            <label className="span-2">
              Description
              <textarea
                className="textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                minLength={10}
                maxLength={500}
              />
            </label>
            <label className="span-2">
              Photo URL
              <input className="input" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} />
            </label>
            <div className="toolbar span-2">
              <button className="btn secondary" type="button" onClick={() => void ticketsQuery.refetch()}>
                Reload Tickets
              </button>
              <button className="btn primary" type="submit" disabled={createMutation.isPending || !selectedPropertyId}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </section>
        <section className="card">
          <h3>Open Tickets</h3>
          {ticketsQuery.isLoading ? <p className="note">Loading maintenance tickets...</p> : null}
          {ticketsQuery.error ? <p className="auth-error">{ticketsQuery.error}</p> : null}
          {!ticketsQuery.isLoading && !ticketsQuery.error && ticketsQuery.data.length === 0 ? (
            <p className="note">No open maintenance tickets.</p>
          ) : null}
          {ticketsQuery.data.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Room</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {ticketsQuery.data.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.id}</td>
                    <td>{ticket.roomId}</td>
                    <td>{ticket.severity}</td>
                    <td>{ticket.status}</td>
                    <td>{formatDateTime(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </div>
    </HousekeepingShell>
  );
}
