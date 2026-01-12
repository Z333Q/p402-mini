import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// GET /api/session?wallet=0x... - Get or create session
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 });
  }

  try {
    // Try to find existing session
    const findRes = await fetch(
      `${P402_API}/api/v2/sessions?wallet=${encodeURIComponent(wallet)}&status=active`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-p402-source': 'base-miniapp',
        },
      }
    );

    if (findRes.ok) {
      const data = await findRes.json();
      if (data.sessions?.length > 0) {
        return NextResponse.json(data.sessions[0]);
      }
    }

    // No existing session, create new one
    const createRes = await fetch(`${P402_API}/api/v2/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      body: JSON.stringify({
        wallet_address: wallet,
        budget_usd: 0,
        source: 'base_miniapp',
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Failed to create session' },
        { status: createRes.status }
      );
    }

    const session = await createRes.json();
    return NextResponse.json(session);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/session - Create new session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${P402_API}/api/v2/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      body: JSON.stringify({
        ...body,
        source: 'base_miniapp',
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
