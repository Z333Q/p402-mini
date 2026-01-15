import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// Cache providers for 5 minutes
let providersCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET /api/providers - List available AI providers and models
export async function GET(req: NextRequest) {
  const includeHealth = req.nextUrl.searchParams.get('health') === 'true';
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

  try {
    // Check cache (only for health=true requests, which are most common)
    if (includeHealth && !forceRefresh && providersCache) {
      const age = Date.now() - providersCache.timestamp;
      if (age < CACHE_TTL) {
        return NextResponse.json(providersCache.data, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Age': String(Math.floor(age / 1000)),
          },
        });
      }
    }

    // Fetch from P402 API
    const url = new URL(`${P402_API}/api/v2/providers`);
    if (includeHealth) {
      url.searchParams.set('health', 'true');
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to fetch providers' }));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();

    // Update cache
    if (includeHealth) {
      providersCache = {
        data,
        timestamp: Date.now(),
      };
    }

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });
  } catch (error) {
    console.error('Providers error:', error);

    // Return cached data on error if available
    if (providersCache) {
      return NextResponse.json(providersCache.data, {
        headers: {
          'X-Cache': 'STALE',
          'X-Cache-Error': 'true',
        },
      });
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout', code: 'TIMEOUT' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
