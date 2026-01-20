import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

/**
 * GET /api/providers
 * Proxy to P402 providers endpoint with response normalization
 */
export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${P402_API}/api/v2/providers?health=true`, {
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('Providers fetch failed:', res.status);
      return NextResponse.json({ providers: [] }, { status: res.status });
    }

    const data = await res.json();

    // V2 returns { data: [...] }, transform to { providers: [...] }
    // for backward compatibility with mini app components
    const providers = data.data || data.providers || [];

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Providers error:', error);
    return NextResponse.json({ providers: [] }, { status: 500 });
  }
}
