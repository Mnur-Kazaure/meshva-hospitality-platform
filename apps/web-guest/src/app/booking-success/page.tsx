import { Suspense } from 'react';
import Screen from '../../widgets/screens/booking-success-screen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}
