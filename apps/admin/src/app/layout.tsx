import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yantrix Admin',
  description: 'Yantrix Super Admin Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
