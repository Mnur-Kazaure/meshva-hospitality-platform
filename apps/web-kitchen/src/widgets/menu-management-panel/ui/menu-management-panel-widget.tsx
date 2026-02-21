'use client';

import { useMemo, useState } from 'react';
import { appEnv } from '../../../shared/config/env';
import { useMenuQuery } from '../../../entities/menu/model/use-menu-query';
import {
  useCreateMenuCategory,
  useCreateMenuItem,
  useUpdateMenuItem,
} from '../../../features/menu-item-management/model/use-menu-item-management';
import { Card } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { FormField } from '../../../shared/ui/form-field';

export function MenuManagementPanelWidget() {
  const propertyId = appEnv.propertyId;
  const menuQuery = useMenuQuery(propertyId);
  const createCategory = useCreateMenuCategory(propertyId);
  const createItem = useCreateMenuItem(propertyId);
  const updateItem = useUpdateMenuItem(propertyId);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('0');
  const [newItemDescription, setNewItemDescription] = useState('');

  const itemsByCategory = useMemo(() => {
    return menuQuery.categories.map((category) => ({
      category,
      items: menuQuery.items.filter((item) => item.categoryId === category.id),
    }));
  }, [menuQuery.categories, menuQuery.items]);

  const onCreateCategory = async () => {
    if (newCategoryName.trim().length < 2) {
      return;
    }
    const result = await createCategory.mutate({ name: newCategoryName.trim() });
    if (result) {
      setNewCategoryName('');
    }
  };

  const onCreateItem = async () => {
    if (!newItemCategoryId || newItemName.trim().length < 2) {
      return;
    }

    const price = Number(newItemPrice);
    if (!Number.isFinite(price) || price < 0) {
      return;
    }

    const result = await createItem.mutate({
      categoryId: newItemCategoryId,
      name: newItemName.trim(),
      price,
      active: true,
      description: newItemDescription || undefined,
    });

    if (result) {
      setNewItemName('');
      setNewItemPrice('0');
      setNewItemDescription('');
    }
  };

  const onToggleItem = (itemId: string, active: boolean) => {
    void updateItem.mutate({
      itemId,
      dto: { active: !active },
    });
  };

  return (
    <div className="grid cols-2">
      <Card title="Create Menu Category">
        <FormField label="Category Name">
          <input
            className="input"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.currentTarget.value)}
            placeholder="Main Meals"
          />
        </FormField>
        <div className="toolbar">
          <Button onClick={onCreateCategory} disabled={createCategory.isPending}>Add Category</Button>
        </div>
      </Card>

      <Card title="Create Menu Item">
        <div className="form-grid">
          <FormField label="Category">
            <select
              className="select"
              value={newItemCategoryId}
              onChange={(event) => setNewItemCategoryId(event.currentTarget.value)}
            >
              <option value="">Select category</option>
              {menuQuery.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Item Name">
            <input className="input" value={newItemName} onChange={(event) => setNewItemName(event.currentTarget.value)} />
          </FormField>
          <FormField label="Price (NGN)">
            <input
              className="input"
              type="number"
              min={0}
              value={newItemPrice}
              onChange={(event) => setNewItemPrice(event.currentTarget.value)}
            />
          </FormField>
          <FormField label="Description">
            <input
              className="input"
              value={newItemDescription}
              onChange={(event) => setNewItemDescription(event.currentTarget.value)}
            />
          </FormField>
        </div>
        <div className="toolbar">
          <Button onClick={onCreateItem} disabled={createItem.isPending}>Add Item</Button>
        </div>
      </Card>

      <Card title="Menu Items">
        {menuQuery.error ? <div className="alert">{menuQuery.error}</div> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Item</th>
              <th>Price</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {itemsByCategory.flatMap(({ category, items }) =>
              items.map((item) => (
                <tr key={item.id}>
                  <td>{category.name}</td>
                  <td>{item.name}</td>
                  <td>NGN {item.price.toLocaleString()}</td>
                  <td>{item.active ? 'Yes' : 'No'}</td>
                  <td>
                    <Button variant="secondary" onClick={() => onToggleItem(item.id, item.active)}>
                      {item.active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
