'use client';

import { useMemo, useState } from 'react';
import type { CreateKitchenOrderDto } from '../../../shared/types/contracts';
import { appEnv } from '../../../shared/config/env';
import { useMenuQuery } from '../../../entities/menu/model/use-menu-query';
import { useCreateKitchenOrder } from '../../../features/create-kitchen-order/model/use-create-kitchen-order';
import { Button } from '../../../shared/ui/button';
import { Card } from '../../../shared/ui/card';
import { FormField } from '../../../shared/ui/form-field';

interface DraftOrderItem {
  menuItemId: string;
  quantity: number;
  itemNote?: string;
}

export function KitchenOrderWorkflow() {
  const propertyId = appEnv.propertyId;
  const { categories, items } = useMenuQuery(propertyId);
  const createOrder = useCreateKitchenOrder(propertyId);

  const [stayId, setStayId] = useState('');
  const [roomOrGuestQuery, setRoomOrGuestQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([{ menuItemId: '', quantity: 1, itemNote: '' }]);
  const [message, setMessage] = useState<string | null>(null);

  const activeItems = useMemo(() => items.filter((entry) => entry.active), [items]);

  const addDraftItem = () => {
    setDraftItems((prev) => [...prev, { menuItemId: '', quantity: 1, itemNote: '' }]);
  };

  const updateDraftItem = (index: number, patch: Partial<DraftOrderItem>) => {
    setDraftItems((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry)));
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onSubmit = async () => {
    const normalizedItems = draftItems
      .filter((entry) => entry.menuItemId && entry.quantity > 0)
      .map((entry) => ({
        menuItemId: entry.menuItemId,
        quantity: entry.quantity,
        itemNote: entry.itemNote || undefined,
      }));

    if (!stayId) {
      setMessage('Stay ID is required and must map to an OPEN stay.');
      return;
    }
    if (normalizedItems.length === 0) {
      setMessage('Add at least one menu item to create an order.');
      return;
    }

    const payload: CreateKitchenOrderDto = {
      stayId,
      notes: notes || undefined,
      items: normalizedItems,
    };

    const result = await createOrder.mutate(payload);
    if (!result) {
      setMessage(createOrder.error ?? 'Failed to create order');
      return;
    }

    setMessage('Order created and queued in NEW status.');
    setNotes('');
    setDraftItems([{ menuItemId: '', quantity: 1, itemNote: '' }]);
  };

  return (
    <div className="grid cols-2">
      <Card title="Step 1: Link to Active Stay">
        <div className="form-grid">
          <FormField label="Property Context">
            <input className="input" value={propertyId ?? ''} readOnly placeholder="Set NEXT_PUBLIC_PROPERTY_ID" />
          </FormField>
          <FormField label="Stay ID (OPEN required)">
            <input className="input" value={stayId} onChange={(event) => setStayId(event.currentTarget.value)} placeholder="stay-xxxx" />
          </FormField>
          <FormField label="Room/Guest Search (assistive)">
            <input
              className="input"
              value={roomOrGuestQuery}
              onChange={(event) => setRoomOrGuestQuery(event.currentTarget.value)}
              placeholder="Room 204 or guest name"
            />
          </FormField>
        </div>
        <p className="note">Phase 1 policy: room service must link to an OPEN stay.</p>
      </Card>

      <Card title="Step 2: Select Menu Items">
        {draftItems.map((entry, index) => (
          <div key={`line-${index}`} className="line-item">
            <select
              className="select"
              value={entry.menuItemId}
              onChange={(event) => updateDraftItem(index, { menuItemId: event.currentTarget.value })}
            >
              <option value="">Select menu item</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {activeItems
                    .filter((item) => item.categoryId === category.id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - NGN {item.price.toLocaleString()}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min={1}
              max={20}
              value={entry.quantity}
              onChange={(event) => updateDraftItem(index, { quantity: Number(event.currentTarget.value) || 1 })}
            />
            <input
              className="input"
              value={entry.itemNote ?? ''}
              onChange={(event) => updateDraftItem(index, { itemNote: event.currentTarget.value })}
              placeholder="Item note (optional)"
            />
            <Button variant="ghost" onClick={() => removeDraftItem(index)} disabled={draftItems.length === 1}>
              Remove
            </Button>
          </div>
        ))}
        <div className="toolbar">
          <Button variant="secondary" onClick={addDraftItem}>
            Add Item
          </Button>
        </div>
      </Card>

      <Card title="Step 3: Confirm Order">
        <FormField label="Order Note">
          <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.currentTarget.value)} maxLength={300} />
        </FormField>
        <div className="toolbar">
          <Button onClick={onSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
        {message ? <p className="note">{message}</p> : null}
      </Card>
    </div>
  );
}
