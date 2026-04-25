import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Yantrix Labs — Smart Business Software & Digital Products',
    template: '%s | Yantrix Labs',
  },
  description: 'Yantrix Labs builds smart digital products and business tools. SaaS platforms, GST billing, HR tools, booking systems, and custom business software for startups, SMEs, and enterprises.',
  keywords: ['software company India', 'business software', 'SaaS platform', 'GST billing software', 'custom software development', 'yantrix labs', 'startup software'],
  authors: [{ name: 'Yantrix Labs' }],
  creator: 'Yantrix Labs',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://yantrixlab.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://yantrixlab.com',
    siteName: 'Yantrix Labs',
    title: 'Yantrix Labs — Smart Business Software & Digital Products',
    description: 'We build smart digital products and business tools for startups, SMEs, and enterprises.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yantrix Labs — Smart Business Software',
    description: 'SaaS platforms, GST billing, booking systems & custom business software.',
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
