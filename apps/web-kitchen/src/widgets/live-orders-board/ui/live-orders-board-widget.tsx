'use client';

import { useMemo } from 'react';
import { appEnv } from '../../../shared/config/env';
import { KitchenOrderStatuses } from '../../../shared/types/contracts';
import { useKitchenOrdersQuery } from '../../../entities/kitchen-order/model/use-kitchen-orders-query';
import { useOrderStatusTransition } from '../../../features/order-status-transition/model/use-order-status-transition';
import { useCancelKitchenOrder } from '../../../features/cancel-kitchen-order/model/use-cancel-kitchen-order';
import { usePostKitchenCharge } from '../../../features/post-kitchen-charge/model/use-post-kitchen-charge';
import { OrderStatusPill } from '../../../entities/kitchen-order/ui/order-status-pill';
import { Button } from '../../../shared/ui/button';
import { Card } from '../../../shared/ui/card';
import type { KitchenOrder } from '../../../entities/kitchen-order/model/types';

const kanbanStatuses = [
  KitchenOrderStatuses.NEW,
  KitchenOrderStatuses.ACCEPTED,
  KitchenOrderStatuses.IN_PREP,
  KitchenOrderStatuses.READY,
  KitchenOrderStatuses.DELIVERED,
  KitchenOrderStatuses.CANCELLED,
  KitchenOrderStatuses.CANCELLED_WITH_REASON,
];

export function LiveOrdersBoardWidget() {
  const propertyId = appEnv.propertyId;
  const ordersQuery = useKitchenOrdersQuery(propertyId);
  const transition = useOrderStatusTransition(propertyId);
  const cancelOrder = useCancelKitchenOrder(propertyId);
  const postCharge = usePostKitchenCharge(propertyId);

  const groupedOrders = useMemo(() => {
    return Object.fromEntries(
      kanbanStatuses.map((status) => [
        status,
        ordersQuery.data.filter((order) => order.status === status),
      ]),
    ) as Record<(typeof kanbanStatuses)[number], KitchenOrder[]>;
  }, [ordersQuery.data]);

  const runStatusTransition = (orderId: string, toStatus: 'ACCEPTED' | 'IN_PREP' | 'READY' | 'DELIVERED') => {
    void transition.mutate({
      orderId,
      dto: { toStatus },
    });
  };

  const runCancel = (orderId: string, override?: boolean) => {
    const reason = window.prompt('Cancellation reason (required):', 'Guest request');
    if (!reason || reason.trim().length < 5) {
      return;
    }

    void cancelOrder.mutate({
      orderId,
      dto: { reason },
      override,
    });
  };

  const runPostCharge = (orderId: string) => {
    void postCharge.mutate({
      orderId,
      dto: {},
    });
  };

  return (
    <>
      {propertyId ? null : (
        <div className="alert">
          NEXT_PUBLIC_PROPERTY_ID is not configured. Running in local fallback mode for UI validation.
        </div>
      )}
      {ordersQuery.error ? <div className="alert">{ordersQuery.error}</div> : null}

      <div className="kanban-grid">
        {kanbanStatuses.map((status) => (
          <Card key={status} title={`${status} (${groupedOrders[status].length})`}>
            <div className="order-column">
              {ordersQuery.isLoading ? <p className="note">Loading...</p> : null}
              {groupedOrders[status].map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-card-head">
                    <strong>{order.code}</strong>
                    <OrderStatusPill status={order.status} />
                  </div>
                  <p className="note">{order.roomLabel} | {order.guestLabel}</p>
                  <p className="note">Items: {order.items.length} | Total: NGN {order.totalAmount.toLocaleString()}</p>
                  {order.notes ? <p className="note">Note: {order.notes}</p> : null}
                  {order.cancelledReason ? <p className="note">Reason: {order.cancelledReason}</p> : null}
                  <div className="toolbar compact">
                    {order.status === KitchenOrderStatuses.NEW ? (
                      <>
                        <Button variant="primary" onClick={() => runStatusTransition(order.id, 'ACCEPTED')}>Accept</Button>
                        <Button variant="danger" onClick={() => runCancel(order.id)}>Cancel</Button>
                      </>
                    ) : null}
                    {order.status === KitchenOrderStatuses.ACCEPTED ? (
                      <>
                        <Button variant="primary" onClick={() => runStatusTransition(order.id, 'IN_PREP')}>Start Prep</Button>
                        <Button variant="danger" onClick={() => runCancel(order.id)}>Cancel</Button>
                      </>
                    ) : null}
                    {order.status === KitchenOrderStatuses.IN_PREP ? (
                      <>
                        <Button variant="primary" onClick={() => runStatusTransition(order.id, 'READY')}>Mark Ready</Button>
                        <Button variant="secondary" onClick={() => runCancel(order.id, true)}>Cancel Override</Button>
                      </>
                    ) : null}
                    {order.status === KitchenOrderStatuses.READY ? (
                      <>
                        <Button variant="primary" onClick={() => runStatusTransition(order.id, 'DELIVERED')}>Mark Delivered</Button>
                        <Button variant="secondary" onClick={() => runCancel(order.id, true)}>Cancel Override</Button>
                      </>
                    ) : null}
                    {order.status === KitchenOrderStatuses.DELIVERED ? (
                      <Button
                        variant={order.chargePostedAt ? 'ghost' : 'primary'}
                        disabled={Boolean(order.chargePostedAt)}
                        onClick={() => runPostCharge(order.id)}
                      >
                        {order.chargePostedAt ? 'Charge Posted' : 'Post Charge'}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
              {!ordersQuery.isLoading && groupedOrders[status].length === 0 ? <p className="note">No orders</p> : null}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
