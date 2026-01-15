import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// GET /api/session?wallet=0x... - Get or create session
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 });
  }

  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
  }

  try {
    // Try to find existing session
    const findRes = await fetch(
      `${P402_API}/api/v2/sessions?wallet=${encodeURIComponent(wallet.toLowerCase())}&status=active`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-p402-source': 'base-miniapp',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000),
      }
    );

    // FIXED: Check if response IS ok before accessing data
    if (findRes.ok) {
      const data = await findRes.json();
      if (data.sessions?.length > 0) {
        // Return the most recent active session
        return NextResponse.json(data.sessions[0]);
      }
    }

    // No existing session found, create new one
    const createRes = await fetch(`${P402_API}/api/v2/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      body: JSON.stringify({
        wallet_address: wallet.toLowerCase(),
        budget_usd: 0,
        source: 'base_miniapp',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!createRes.ok) {
      const error = await createRes.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Session creation failed:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to create session' },
        { status: createRes.status }
      );
    }

    const session = await createRes.json();
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Session error:', error);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout - P402 API not responding' },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/session - Create new session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.wallet_address) {
      return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.wallet_address)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    const res = await fetch(`${P402_API}/api/v2/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      body: JSON.stringify({
        ...body,
        wallet_address: body.wallet_address.toLowerCase(),
        source: 'base_miniapp',
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Create session error:', error);

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout - P402 API not responding' },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
