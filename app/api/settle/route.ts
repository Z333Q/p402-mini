import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

/**
 * POST /api/settle
 * Proxy to P402 Router's /api/v1/router/settle for EIP-3009 payment settlement.
 * Accepts an authorization + signature, forwards to backend which verifies
 * and executes the USDC transfer on-chain.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = req.headers.get('x-p402-session');

    if (!body.payment?.scheme) {
      return NextResponse.json(
        { error: 'payment.scheme required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${P402_API}/api/v1/router/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-source': 'base-miniapp',
        ...(sessionId ? { 'x-p402-session': sessionId } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error?.message || error.error || error.message || 'Settlement failed' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Settlement proxy error:', error);
    return NextResponse.json(
      { error: 'Settlement proxy failed' },
      { status: 500 }
    );
  }
}
