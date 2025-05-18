import './globals.css';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: '30-te urodziny Asi i Maćka',
  description: 'Cyfrowa księga gości na uroczystość 30-tych urodzin',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={montserrat.className}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
} 