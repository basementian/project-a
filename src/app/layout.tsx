import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AppProviders } from '@/providers/AppProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DIBS - Share Access, Save Time',
  description: 'Real-time peer-to-peer access exchange',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <AppProviders>
          <main className="mx-auto max-w-[430px] min-h-screen bg-white shadow-sm relative">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
