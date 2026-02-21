'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { UpdateGuestProfileDto } from '../../shared/types/contracts';
import { useGuestProfileQuery } from '../../entities/guest-profile/model/use-guest-profile-query';
import { useUpdateGuestProfileMutation } from '../../features/guest-profile-edit/model/use-update-guest-profile';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

export default function ProfilePage() {
  const profileQuery = useGuestProfileQuery();
  const updateMutation = useUpdateGuestProfileMutation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setFullName(profileQuery.data.fullName ?? '');
    setPhone(profileQuery.data.phone ?? '');
    setEmail(profileQuery.data.email ?? '');
  }, [profileQuery.data]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    const payload: UpdateGuestProfileDto = {
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };

    const result = await updateMutation.mutate(payload);
    if (!result) {
      return;
    }

    setSuccess('Profile updated successfully.');
    await profileQuery.refetch();
  };

  return (
    <GuestShell title="Profile">
      <section className="card">
        {profileQuery.isLoading ? <p className="note">Loading profile...</p> : null}
        {profileQuery.error ? <p className="auth-error">{profileQuery.error}</p> : null}
        {success ? <div className="alert">{success}</div> : null}
        {updateMutation.error ? <p className="auth-error">{updateMutation.error}</p> : null}

        <form className="grid" onSubmit={onSubmit}>
          <div className="form-grid cols-2">
            <label>
              Full Name
              <input
                className="input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label>
              Phone
              <input
                className="input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label>
              Email
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          </div>

          <div className="toolbar">
            <button className="btn secondary" type="button" onClick={() => void profileQuery.refetch()}>
              Reload
            </button>
            <button className="btn primary" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </section>
    </GuestShell>
  );
}
