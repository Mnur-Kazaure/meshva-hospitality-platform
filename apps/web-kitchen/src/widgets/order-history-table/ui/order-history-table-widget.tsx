'use client';

import { useMemo, useState } from 'react';
import { appEnv } from '../../../shared/config/env';
import { useKitchenHistoryQuery } from '../../../entities/kitchen-order/model/use-kitchen-history-query';
import { OrderStatusPill } from '../../../entities/kitchen-order/ui/order-status-pill';
import { Card } from '../../../shared/ui/card';

export function OrderHistoryTableWidget() {
  const propertyId = appEnv.propertyId;
  const historyQuery = useKitchenHistoryQuery(propertyId);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return historyQuery.data;
    }

    return historyQuery.data.filter((entry) => {
      return (
        entry.code.toLowerCase().includes(term) ||
        entry.roomLabel.toLowerCase().includes(term) ||
        entry.guestLabel.toLowerCase().includes(term)
      );
    });
  }, [historyQuery.data, search]);

  return (
    <Card title="Completed and Cancelled Orders">
      <div className="toolbar">
        <input
          className="input"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search by order code, room, or guest"
        />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Room</th>
            <th>Guest</th>
            <th>Status</th>
            <th>Total</th>
            <th>Charge Posted</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.code}</td>
              <td>{entry.roomLabel}</td>
              <td>{entry.guestLabel}</td>
              <td><OrderStatusPill status={entry.status} /></td>
              <td>NGN {entry.totalAmount.toLocaleString()}</td>
              <td>{entry.chargePostedAt ? 'Yes' : 'No'}</td>
              <td>{new Date(entry.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {historyQuery.isLoading ? <p className="note">Loading history...</p> : null}
      {!historyQuery.isLoading && filtered.length === 0 ? <p className="note">No history records</p> : null}
    </Card>
  );
}
