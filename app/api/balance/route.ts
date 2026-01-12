import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// GET /api/balance?session_id=xxx - Get session balance
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${P402_API}/api/v2/sessions/${sessionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Failed to fetch balance' },
        { status: res.status }
      );
    }

    const session = await res.json();
    
    return NextResponse.json({
      session_id: session.session_id,
      balance_usdc: session.balance_usdc,
      budget_total: session.budget_total,
      budget_spent: session.budget_spent,
      status: session.status,
    });
  } catch (error) {
    console.error('Balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
