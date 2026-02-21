import type { Metadata } from 'next';
import './globals.css';
import { GuestAuthGate } from '../processes/auth/ui/guest-auth-gate';

export const metadata: Metadata = {
  title: 'Meshva Guest Portal',
  description: 'Guest Booking Portal - Meshva Hospitality',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><GuestAuthGate>{children}</GuestAuthGate></body>
    </html>
  );
}
