#!/usr/bin/env npx ts-node

/**
 * P402 Mini App Integration Test Script
 * 
 * Run with: npx ts-node scripts/test-integration.ts
 */

const P402_API = process.env.P402_API_URL || 'https://p402.io';

async function runTest(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   ${error instanceof Error ? error.message : error}`);
        process.exitCode = 1;
    }
}

async function main() {
    console.log(`\n🧪 Testing P402 API Integration`);
    console.log(`   API URL: ${P402_API}\n`);

    // Test 1: Health check (if exists)
    await runTest('API is reachable', async () => {
        const res = await fetch(`${P402_API}/`, { method: 'HEAD' });
        if (!res.ok && res.status !== 404) {
            throw new Error(`Status: ${res.status}`);
        }
    });

    // Test 2: Providers endpoint
    await runTest('GET /api/v2/providers returns providers', async () => {
        const res = await fetch(`${P402_API}/api/v2/providers?health=true`);
        if (!res.ok) {
            throw new Error(`Status: ${res.status}`);
        }
        const data = await res.json();
        if (!data.providers || !Array.isArray(data.providers)) {
            throw new Error('Invalid response format');
        }
    });

    // Test 3: Create session
    let sessionId: string | null = null;
    await runTest('POST /api/v2/sessions creates session', async () => {
        const res = await fetch(`${P402_API}/api/v2/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: '0x' + '1'.repeat(40),
                source: 'integration_test',
            }),
        });
        if (!res.ok) {
            throw new Error(`Status: ${res.status}`);
        }
        const data = await res.json();
        if (!data.session_id) {
            throw new Error('No session_id in response');
        }
        sessionId = data.session_id;
    });

    // Test 4: Get session
    if (sessionId) {
        await runTest('GET /api/v2/sessions/:id returns session', async () => {
            const res = await fetch(`${P402_API}/api/v2/sessions/${sessionId}`);
            if (!res.ok) {
                throw new Error(`Status: ${res.status}`);
            }
            const data = await res.json();
            if (data.session_id !== sessionId) {
                throw new Error('Session ID mismatch');
            }
        });
    }

    // Test 5: Chat completions (will fail without balance, but tests endpoint exists)
    if (sessionId) {
        await runTest('POST /api/v2/chat/completions returns 402 without balance', async () => {
            const res = await fetch(`${P402_API}/api/v2/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-p402-session': sessionId!,
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: 'Hello' }],
                }),
            });
            // Expect 402 (payment required) or success
            if (res.status !== 402 && !res.ok) {
                throw new Error(`Unexpected status: ${res.status}`);
            }
        });
    }

    console.log('\n✨ Integration tests complete\n');
}

main().catch(console.error);
