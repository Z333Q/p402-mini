const fetch = require('node-fetch');

async function testApi() {
    const HOSTS = ['https://p402.io', 'https://api.p402.io'];
    const ENDPOINTS = [
        '/api/v2/providers?health=true',
        '/api/v2/chat/completions',
    ];

    console.log('Testing V2 AI Gateway Availability...\n');

    for (const host of HOSTS) {
        console.log(`Checking HOST: ${host}`);
        for (const endpoint of ENDPOINTS) {
            const url = `${host}${endpoint}`;
            process.stdout.write(`  Trying ${endpoint.padEnd(30)} ... `);

            try {
                const response = await fetch(url, {
                    headers: { 'Content-Type': 'application/json' },
                    method: endpoint.includes('chat') ? 'POST' : 'GET',
                    body: endpoint.includes('chat') ? JSON.stringify({ model: 'gpt-4', messages: [] }) : undefined
                });

                if (response.ok) {
                    console.log(`✅ OK (${response.status})`);
                } else {
                    console.log(`❌ ${response.status} ${response.statusText}`);
                }
            } catch (err) {
                console.log(`❌ Error: ${err.message}`);
            }
        }
        console.log('');
    }
}

testApi();
