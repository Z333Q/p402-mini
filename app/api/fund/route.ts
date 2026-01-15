import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// Minimum and maximum funding amounts
const MIN_AMOUNT = 0.01;  // $0.01 minimum
const MAX_AMOUNT = 10000; // $10,000 maximum

// POST /api/fund - Credit session after Base Pay
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, amount, tx_hash, source = 'base_pay' } = body;

    // Validate required fields
    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id required', code: 'MISSING_SESSION_ID' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'amount required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate session ID format
    if (!session_id.startsWith('sess_')) {
      return NextResponse.json(
        { error: 'Invalid session_id format', code: 'INVALID_SESSION_ID' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return NextResponse.json(
        { error: 'Invalid amount format', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (amountNum < MIN_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum amount is $${MIN_AMOUNT}`, code: 'AMOUNT_TOO_LOW' },
        { status: 400 }
      );
    }

    if (amountNum > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Maximum amount is $${MAX_AMOUNT}`, code: 'AMOUNT_TOO_HIGH' },
        { status: 400 }
      );
    }

    // Validate tx_hash format if provided
    if (tx_hash && !/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format', code: 'INVALID_TX_HASH' },
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
        amount: amountNum.toFixed(6), // 6 decimal places for USDC
        tx_hash,
        source,
        network: 'base',
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout for blockchain verification
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));

      // Handle specific error codes
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
          { status: 404 }
        );
      }

      if (res.status === 409) {
        return NextResponse.json(
          { error: 'Transaction already processed', code: 'DUPLICATE_TX' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.error || 'Failed to fund session', code: error.code },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Log successful funding for analytics
    console.log('[P402 MiniApp] Session funded:', {
      session_id,
      amount: amountNum,
      tx_hash,
      new_balance: data.session?.balance_usdc,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fund error:', error);

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Transaction verification timeout', code: 'TIMEOUT' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
