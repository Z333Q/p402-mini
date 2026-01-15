import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// GET /api/balance?session_id=sess_xxx - Get session balance
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id') ||
    req.headers.get('x-p402-session');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id required (query param or x-p402-session header)' },
      { status: 400 }
    );
  }

  // Validate session ID format
  if (!sessionId.startsWith('sess_')) {
    return NextResponse.json(
      { error: 'Invalid session_id format' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${P402_API}/api/v2/sessions/${sessionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
          { status: 404 }
        );
      }

      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(error, { status: res.status });
    }

    const session = await res.json();

    // Return balance-focused response
    return NextResponse.json({
      session_id: session.session_id,
      balance_usdc: session.balance_usdc,
      budget_total: session.budget_total,
      budget_spent: session.budget_spent,
      budget_remaining: session.balance_usdc,
      status: session.status,
    });
  } catch (error) {
    console.error('Balance error:', error);

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
