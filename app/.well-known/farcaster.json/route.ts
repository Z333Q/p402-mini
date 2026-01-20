import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://mini.p402.io';

export async function GET() {
  const manifest = {
    // Account association - FILL THESE AFTER SIGNING AT base.dev
    accountAssociation: {
      header: process.env.MANIFEST_HEADER || "eyJmaWQiOi0xLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4RTdiNTVlMzk3Q2IzOTUzM0Y2M0Q0MWIxMzVERkUyRTJkOTk5YTVhMCJ9",
      payload: process.env.MANIFEST_PAYLOAD || "eyJkb21haW4iOiJtaW5pLnA0MDIuaW8ifQ",
      signature: process.env.MANIFEST_SIGNATURE || "AAAAAAAAAAAAAAAAyhG94Fl3s2MRZwKIYr4qFzl2yhEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiSCrVbLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAul7REO_bo9AFv8iC11NYrLu4WEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASQ_-6NvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAnOSKGvCTDk-LCsGBiVgSTI_18Z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAPhSELIcxQMC9He6VmhtIBncm2etAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABByqqfEfDyf0wxD4rYOiJc8H8MGzPWjR8IrG64WOiMdy1djSs_Qnc8T88oUOaBg1WtwjkgV_gYhS-mCyrZDukKSRsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJI",
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
        'Access over 100 AI models including GPT Claude and Llama. Pay with USDC on Base. Save 70 percent versus direct API access. Smart routing picks the best model for you.',
      screenshotUrls: [
        `${APP_URL}/screenshots/chat.png`,
        `${APP_URL}/screenshots/models.png`,
        `${APP_URL}/screenshots/savings.png`,
      ],
      primaryCategory: 'developer-tools',
      tags: ['ai', 'llm', 'api', 'crypto', 'usdc'],

      // Social/OG
      heroImageUrl: `${APP_URL}/og-image.png`,
      tagline: 'Stop overpaying for AI',
      ogTitle: 'P402 - AI Without Overpaying',
      ogDescription: 'Access over 100 AI models. Pay with USDC. Save 70 percent.',
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
