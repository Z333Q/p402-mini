import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://mini.p402.io';

export async function GET() {
  const manifest = {
    // Account association - FILL THESE AFTER SIGNING AT base.dev
    accountAssociation: {
      header: process.env.MANIFEST_HEADER || '',
      payload: process.env.MANIFEST_PAYLOAD || '',
      signature: process.env.MANIFEST_SIGNATURE || '',
    },
    miniapp: {
      version: '1',
      name: 'P402',
      homeUrl: APP_URL,
      iconUrl: `${APP_URL}/icon.png`,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#000000',
      webhookUrl: `${APP_URL}/api/webhook`,

      // Discovery
      subtitle: 'AI Without Overpaying',
      description:
        'Access 100+ AI models from GPT-4, Claude, Llama and more. Pay with USDC on Base. Save 70% vs direct API access. Smart routing automatically picks the best model for your task.',
      screenshotUrls: [
        `${APP_URL}/screenshots/chat.png`,
        `${APP_URL}/screenshots/models.png`,
        `${APP_URL}/screenshots/savings.png`,
      ],
      primaryCategory: 'developer-tools',
      tags: ['ai', 'llm', 'api', 'crypto', 'usdc', 'payments', 'gpt', 'claude'],

      // Social/OG
      heroImageUrl: `${APP_URL}/og-image.png`,
      tagline: 'Stop overpaying for AI',
      ogTitle: 'P402 - AI Without Overpaying',
      ogDescription: 'Access 100+ AI models. Pay with USDC. Save 70%.',
      ogImageUrl: `${APP_URL}/og-image.png`,

      // Indexing
      noindex: false,
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
