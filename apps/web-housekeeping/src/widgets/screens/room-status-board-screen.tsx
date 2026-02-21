'use client';

import { RoomStatus } from '../../shared/types/contracts';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useRoomStatusBoardQuery } from '../../entities/housekeeping/model/use-room-status-board-query';
import { HousekeepingShell } from '../dashboard-shell/ui/housekeeping-shell';

export default function RoomStatusBoardPage() {
  const { selectedPropertyId } = useStaffSession();
  const boardQuery = useRoomStatusBoardQuery(selectedPropertyId);

  const metrics = {
    dirty: boardQuery.data.filter((room) => room.roomStatus === RoomStatus.DIRTY).length,
    cleaning: boardQuery.data.filter((room) => room.roomStatus === RoomStatus.CLEANING).length,
    clean: boardQuery.data.filter((room) => room.roomStatus === RoomStatus.CLEAN).length,
    ready: boardQuery.data.filter((room) => room.roomStatus === RoomStatus.READY).length,
  };

  return (
    <HousekeepingShell title="Room Status Board">
      <div className="grid cols-2">
        <section className="card">
          <h3>Status Pipeline</h3>
          {boardQuery.isLoading ? <p className="note">Loading room board...</p> : null}
          {boardQuery.error ? <p className="auth-error">{boardQuery.error}</p> : null}
          {!boardQuery.isLoading && !boardQuery.error ? (
            <table className="table">
              <tbody>
                <tr><td>DIRTY</td><td>{metrics.dirty} rooms</td></tr>
                <tr><td>CLEANING</td><td>{metrics.cleaning} rooms</td></tr>
                <tr><td>CLEAN</td><td>{metrics.clean} rooms</td></tr>
                <tr><td>READY</td><td>{metrics.ready} rooms</td></tr>
              </tbody>
            </table>
          ) : null}
        </section>
        <section className="card">
          <h3>Transition Rules</h3>
          <div className="alert">
            Allowed only: DIRTY -&gt; CLEANING -&gt; CLEAN -&gt; READY. Front Desk controls DIRTY at checkout.
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>Rooms</h3>
        {!selectedPropertyId ? <p className="auth-error">Select a property to view room statuses.</p> : null}
        {!boardQuery.isLoading && !boardQuery.error && boardQuery.data.length === 0 ? (
          <p className="note">No rooms found in the selected property.</p>
        ) : null}
        {boardQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Room Status</th>
                <th>Task Status</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {boardQuery.data.map((room) => (
                <tr key={room.roomId}>
                  <td>{room.roomNumber}</td>
                  <td>{room.roomType ?? '-'}</td>
                  <td>{room.roomStatus}</td>
                  <td>{room.activeTaskStatus ?? '-'}</td>
                  <td>{room.assignedUserId ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </HousekeepingShell>
  );
}
