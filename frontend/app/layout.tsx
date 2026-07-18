import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import ToastContainer from '@/components/ui/Toast';
import FontProvider from '@/components/ui/FontProvider';

export const metadata: Metadata = {
  title: 'Food Port POS',
  description: 'Order from your favourite booths at Food Port',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#F4F7F5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full bg-brand-bg text-brand-white font-body antialiased">
        <FontProvider />
        {children}
        <ToastContainer />
        <a
          href="https://sapiensstation.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-3 right-3 z-[60] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #FF5F6D, #FFC371, #58D0A2, #5D8BEA)',
            backgroundSize: '300% 300%',
            animation: 'credit-gradient 6s ease infinite',
          }}
        >
          made with <span className="text-sm">♥</span> by Sapiens Station
        </a>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(() => {}); }`}
        </Script>
      </body>
    </html>
  );
}
