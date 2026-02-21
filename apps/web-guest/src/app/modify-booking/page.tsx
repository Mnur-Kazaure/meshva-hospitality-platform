import { Suspense } from 'react';
import Screen from '../../widgets/screens/modify-booking-screen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}
