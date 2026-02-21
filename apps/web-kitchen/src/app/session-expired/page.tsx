import { AccountStatusView } from '../../shared/ui/account-status-view';

export default function SessionExpiredPage() {
  return (
    <AccountStatusView
      title="Session expired"
      message="Your session has expired. Please sign in again."
      ctaLabel="Go to login"
      ctaHref="/login"
    />
  );
}
