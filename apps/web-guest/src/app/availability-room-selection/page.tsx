import { Suspense } from 'react';
import Screen from '../../widgets/screens/availability-room-selection-screen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}
