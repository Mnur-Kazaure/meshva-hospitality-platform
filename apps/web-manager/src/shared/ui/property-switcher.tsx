'use client';

import { useStaffSession } from '../../processes/auth/model/staff-session-context';

export function PropertySwitcher() {
  const { session, selectedPropertyId, setSelectedPropertyId } = useStaffSession();

  if (session.accessibleProperties.length <= 1) {
    return (
      <span className="badge">
        Property: {session.accessibleProperties[0]?.name ?? 'Not assigned'}
      </span>
    );
  }

  return (
    <label className="badge" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      Property
      <select
        className="select"
        value={selectedPropertyId ?? ''}
        onChange={(event) => setSelectedPropertyId(event.target.value)}
        style={{ minWidth: 200 }}
      >
        {session.accessibleProperties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.name}
          </option>
        ))}
      </select>
    </label>
  );
}
