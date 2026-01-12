import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || process.env.NEXT_PUBLIC_P402_API_URL || 'https://p402.io';

// GET /api/providers - Get available providers and models
export async function GET(req: NextRequest) {
  try {
    const includeHealth = req.nextUrl.searchParams.get('health') === 'true';

    const res = await fetch(
      `${P402_API}/api/v2/providers${includeHealth ? '?health=true' : ''}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-p402-source': 'base-miniapp',
        },
        // Cache for 1 minute
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Failed to fetch providers' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/providers - Compare costs for given parameters
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${P402_API}/api/v2/providers/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Compare error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
