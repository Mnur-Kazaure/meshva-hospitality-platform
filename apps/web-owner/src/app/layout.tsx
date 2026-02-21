import type { Metadata } from 'next';
import './globals.css';
import { StaffAuthGate } from '../processes/auth/ui/staff-auth-gate';

export const metadata: Metadata = {
  title: 'Meshva Owner Console',
  description: 'Owner Dashboard - Meshva Hospitality',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><StaffAuthGate>{children}</StaffAuthGate></body>
    </html>
  );
}
