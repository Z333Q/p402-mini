import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

/**
 * Normalize session response to ensure both id and session_id are present
 */
function normalizeSession(session: any) {
  if (!session) return session;
  return {
    ...session,
    id: session.id || session.session_id,
    session_id: session.session_id || session.id,
    balance_usdc: session.balance_usdc ?? session.budget?.remaining_usd ?? 0,
    budget_total: session.budget_total ?? session.budget?.total_usd ?? 0,
    budget_spent: session.budget_spent ?? session.budget?.used_usd ?? 0,
  };
}

/**
 * POST /api/fund
 * Credit session after Base Pay payment
 */
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

    // Validate session ID format
    if (!session_id.startsWith('sess_')) {
      return NextResponse.json(
        { error: 'Invalid session_id format' },
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
        { error: error.error?.message || error.error || 'Failed to fund session' },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Normalize session in response for backward compatibility
    if (data.session) {
      data.session = normalizeSession(data.session);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fund error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
