import { Suspense } from 'react';
import Screen from '../../widgets/screens/booking-confirmation-screen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}
