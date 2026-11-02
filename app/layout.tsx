import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { TitleProvider } from '@/lib/TitleContext';
import { Toaster } from 'react-hot-toast';
import { PwaServiceWorker } from '@/components/PwaServiceWorker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tu Cancionero',
  description: 'Organiza canciones, acordes y listas de reproducción',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tu Cancionero',
  },
};

export const viewport: Viewport = {
  themeColor: '#f0f9ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <TitleProvider>
            {children}
          </TitleProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          <PwaServiceWorker />
        </ThemeProvider>
      </body>
    </html>
  );
}
