import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// POST /api/fund - Credit session after Base Pay
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, amount, tx_hash } = body;

    if (!session_id || !amount) {
      return NextResponse.json(
        { error: 'session_id and amount required' },
        { status: 400 }
      );
    }

    // Call P402 to credit the session
    const res = await fetch(`${P402_API}/api/v2/sessions/fund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
        'x-p402-session': session_id,
      },
      body: JSON.stringify({
        session_id,
        amount,
        tx_hash,
        source: 'base_pay',
        network: 'base',
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Failed to fund session' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fund error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
