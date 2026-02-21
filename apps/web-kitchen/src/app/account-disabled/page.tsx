import { AccountStatusView } from '../../shared/ui/account-status-view';

export default function AccountDisabledPage() {
  return (
    <AccountStatusView
      title="Account unavailable"
      message="Your account has been temporarily disabled or your organization is suspended. Contact your administrator."
    />
  );
}
