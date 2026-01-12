import type { Metadata, Viewport } from 'next';
import './globals.css';

import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://mini.p402.io';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export const metadata: Metadata = {
  title: 'P402 | The Agentic Commerce Standard',
  description: 'The enterprise-grade settlement protocol for autonomous agents. Secure, scalable, and built on Base.',
  metadataBase: new URL(APP_URL),
  applicationName: 'P402',
  keywords: ['AI', 'LLM', 'API', 'USDC', 'crypto', 'payments', 'Base', 'Agentic Commerce'],
  authors: [{ name: 'P402', url: 'https://p402.io' }],
  openGraph: {
    title: 'P402 | The Agentic Commerce Standard',
    description: 'The enterprise-grade settlement protocol for autonomous agents. Secure, scalable, and built on Base.',
    url: APP_URL,
    siteName: 'P402',
    type: 'website',
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'P402 | The Agentic Commerce Standard',
    description: 'The enterprise-grade settlement protocol for autonomous agents. Secure, scalable, and built on Base.',
    images: [`${APP_URL}/og-image.png`],
  },
  other: {
    // Base mini app identification
    'base:app_id': '6964779bb8395f034ac225a7',
    // Farcaster miniapp metadata
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${APP_URL}/og-image.png`,
      button: {
        title: 'Open P402',
        action: {
          type: 'launch_miniapp',
          name: 'P402',
          url: APP_URL,
          splashImageUrl: `${APP_URL}/splash.png`,
          splashBackgroundColor: '#000000',
        },
      },
    }),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Explicit Base app ID meta tag for maximum compatibility */}
        <meta name="base:app_id" content="6964779bb8395f034ac225a7" />
      </head>
      <body className="bg-neutral-100 text-neutral-900 font-sans antialiased">
        <GoogleAnalytics gaId={GA_ID} />
        {children}
      </body>
    </html>
  );
}