import { NextRequest, NextResponse } from 'next/server';

const P402_API = process.env.P402_API_URL || 'https://p402.io';
const P402_TENANT_ID = process.env.P402_TENANT_ID;

/**
 * A2A Proxy Route
 * ================
 * Catch-all route to proxy /api/a2a/* requests to the P402 Router.
 * Mirrors the V2 proxy pattern for agent-to-agent discovery.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(req, (await params).path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(req, (await params).path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(req, (await params).path);
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-P402-Tenant, X-P402-Session',
            'Access-Control-Max-Age': '86400',
        },
    });
}

async function proxyRequest(req: NextRequest, pathParts: string[]) {
    const path = pathParts.join('/');
    const targetUrl = new URL(`/api/a2a/${path}${req.nextUrl.search}`, P402_API);

    console.log(`[P402 A2A Proxy] ${req.method} ${targetUrl.toString()}`);

    try {
        const headers = new Headers();
        req.headers.forEach((value, key) => {
            if (['content-type', 'x-p402-session', 'authorization', 'x-p402-tenant'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        if (P402_TENANT_ID && !headers.get('x-p402-tenant')) {
            headers.set('x-p402-tenant', P402_TENANT_ID);
        }

        headers.set('x-p402-source', 'base-miniapp-proxy');

        const options: RequestInit = {
            method: req.method,
            headers,
        };

        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            options.body = await req.text();
        }

        const res = await fetch(targetUrl.toString(), options);
        const data = await res.json().catch(() => ({}));

        return NextResponse.json(data, {
            status: res.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error) {
        console.error('[P402 A2A Proxy Error]:', error);
        return NextResponse.json({ error: 'Proxy initialization failed' }, { status: 500 });
    }
}
