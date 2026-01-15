import { NextRequest } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';

// POST /api/chat - Proxy to P402 chat completions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = req.headers.get('x-p402-session');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate session ID format
    if (!sessionId.startsWith('sess_')) {
      return new Response(JSON.stringify({ error: 'Invalid session ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate messages array exists
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isStreaming = body.stream !== false;

    // Forward to P402 API
    const res = await fetch(`${P402_API}/api/v2/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-p402-session': sessionId,
        'x-p402-source': 'base-miniapp',
      },
      body: JSON.stringify({
        ...body,
        stream: isStreaming,
      }),
      // No timeout for streaming - let it run
      ...(isStreaming ? {} : { signal: AbortSignal.timeout(60000) }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Chat request failed' }));

      // Handle specific error codes
      if (res.status === 402) {
        return new Response(JSON.stringify({
          error: 'Insufficient balance',
          code: 'INSUFFICIENT_BALANCE',
          ...error
        }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(error), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For streaming, return the stream directly
    if (isStreaming && res.body) {
      return new Response(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',  // Prevents nginx from buffering
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // For non-streaming, return JSON
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof Error && error.name === 'TimeoutError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout', code: 'TIMEOUT' }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
