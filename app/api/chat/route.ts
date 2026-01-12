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
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Chat request failed' }));
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
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For non-streaming, return JSON
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
