import { Suspense } from 'react';
import Screen from '../../widgets/screens/property-listing-screen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  );
}
