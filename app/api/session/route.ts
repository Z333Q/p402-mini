import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';
const P402_TENANT_ID = process.env.P402_TENANT_ID;

/**
 * Normalize session response to ensure both id and session_id are present
 */
function normalizeSession(session: any) {
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
 * GET /api/session?wallet=0x... 
 * Get or create session for a wallet address
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 });
  }

  try {
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-p402-source': 'base-miniapp',
    };
    if (P402_TENANT_ID) baseHeaders['x-p402-tenant'] = P402_TENANT_ID;

    // Try to find existing session (router filters by tenant, no wallet filter supported)
    const findRes = await fetch(`${P402_API}/api/v2/sessions?status=active`, { headers: baseHeaders });

    if (findRes.ok) {
      const data = await findRes.json();
      const sessions: any[] = data.data || data.sessions || [];
      // Prefer a session matching this wallet address
      const match = sessions.find((s: any) => s.wallet_address === wallet) || sessions[0];
      if (match) {
        return NextResponse.json(normalizeSession(match));
      }
    }

    // No existing session, create new one
    const createRes = await fetch(`${P402_API}/api/v2/sessions`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        wallet_address: wallet,
        budget_usd: 0.01,
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error?.message || error.error || 'Failed to create session' },
        { status: createRes.status }
      );
    }

    const session = await createRes.json();
    return NextResponse.json(normalizeSession(session));
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/session
 * Create new session
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-p402-source': 'base-miniapp',
    };
    if (P402_TENANT_ID) headers['x-p402-tenant'] = P402_TENANT_ID;

    const res = await fetch(`${P402_API}/api/v2/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json(normalizeSession(data), { status: res.status });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
