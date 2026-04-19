import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Yantrix - GST Billing Software for Indian SMEs',
    template: '%s | Yantrix',
  },
  description: 'Professional GST invoicing, billing, and accounting software designed for Indian small businesses. Create GST invoices in 30 seconds.',
  keywords: ['GST billing', 'invoice software', 'Indian SME', 'GST invoice', 'billing software India', 'yantrix'],
  authors: [{ name: 'Yantrix' }],
  creator: 'Yantrix',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://yantrix.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://yantrix.in',
    siteName: 'Yantrix',
    title: 'Yantrix - GST Billing Software for Indian SMEs',
    description: 'Professional GST invoicing and billing software for Indian businesses',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yantrix - GST Billing Software',
    description: 'Professional GST invoicing for Indian SMEs',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
