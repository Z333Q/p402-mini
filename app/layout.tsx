import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://mini.p402.io';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Metadata sanitized for strict Base/Farcaster Discovery validation
// NO special characters: +, %, dots, dashes, pipes
export const metadata: Metadata = {
  title: 'P402 The Agentic Commerce Standard',
  description: 'Access 100 plus AI models from GPT4 Claude Llama and more Pay with USDC and save 70 percent',
  metadataBase: new URL(APP_URL),
  applicationName: 'P402',
  keywords: ['ai', 'llm', 'api', 'crypto', 'usdc', 'payments', 'gpt', 'claude'],
  authors: [{ name: 'P402', url: 'https://p402.io' }],
  openGraph: {
    title: 'P402 The Agentic Commerce Standard',
    description: 'Access 100 plus AI models Pay with USDC and save 70 percent',
    url: APP_URL,
    siteName: 'P402',
    type: 'website',
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'P402 The Agentic Commerce Standard',
    description: 'Access 100 plus AI models Pay with USDC and save 70 percent',
    images: [`${APP_URL}/og-image.png`],
  },
  other: {
    'base:app_id': '6964779bb8395f034ac225a7',
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${APP_URL}/og-image.png`,
      button: {
        title: 'Open P402',
        action: {
          type: 'launch_miniapp',
          name: 'P402',
          url: APP_URL,
          splashImageUrl: `${APP_URL}/og-image.png`,
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
        {/* ULTRA-AGGRESSIVE SUPPRESSION: Runs before any other script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Regex to catch metamask and provider bridge spam
                const spam = /metamask|chainChanged|eth_subscription/i;
                
                // Override console methods
                const methods = ['log', 'info', 'warn', 'debug', 'error'];
                methods.forEach(method => {
                  const original = console[method];
                  console[method] = function(...args) {
                    const content = args.map(arg => {
                      try { return typeof arg === 'string' ? arg : JSON.stringify(arg); }
                      catch(e) { return String(arg); }
                    }).join(' ');
                    
                    if (spam.test(content)) return;
                    return original.apply(console, args);
                  };
                });

                // Intercept and stop propagation of Metamask message events
                const originalAddEventListener = window.addEventListener;
                window.addEventListener = function(type, listener, options) {
                  if (type === 'message') {
                    const filteredListener = function(event) {
                      try {
                        // Never block Farcaster SDK messages
                        const dataString = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
                        if (dataString.includes('farcaster') || (event.data && event.data.type?.startsWith('farcaster'))) {
                          return listener.apply(this, arguments);
                        }

                        if (spam.test(dataString) || (event.data && event.data.target === 'metamask-inpage')) {
                          event.stopImmediatePropagation();
                          return;
                        }
                      } catch (e) {}
                      return listener.apply(this, arguments);
                    };
                    return originalAddEventListener.call(window, type, filteredListener, options);
                  }
                  return originalAddEventListener.call(window, type, listener, options);
                };
              })();
            `
          }}
        />
        <meta name="base:app_id" content="6964779bb8395f034ac225a7" />
      </head>
      <body className="bg-neutral-100 text-neutral-900 font-sans antialiased">
        <GoogleAnalytics gaId={GA_ID} />
        {children}
      </body>
    </html>
  );
}