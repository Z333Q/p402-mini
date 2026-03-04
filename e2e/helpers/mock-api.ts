import type { Page, Route } from '@playwright/test';
import {
  MOCK_SESSION,
  MOCK_PROVIDERS,
  MOCK_SETTLE_RESPONSE,
  MOCK_FUND_RESPONSE,
  buildMockStreamChunks,
} from './fixtures';

/**
 * Register all P402 API route mocks on a Playwright page.
 * Call this before page.goto() to ensure requests are intercepted.
 */
export async function mockP402Api(page: Page) {
  // ── Sessions list (GET /api/v2/sessions?status=active) ──────────────────────
  await page.route('**/api/v2/sessions?status=active', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ object: 'list', data: [MOCK_SESSION], total: 1 }),
    }),
  );

  // ── Session create (POST /api/v2/sessions) ───────────────────────────────────
  await page.route('**/api/v2/sessions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      });
    } else {
      await route.continue();
    }
  });

  // ── Session by ID (GET/DELETE/PATCH /api/v2/sessions/*) ─────────────────────
  await page.route('**/api/v2/sessions/sess_*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      });
    } else if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: MOCK_SESSION.id, status: 'ended' }),
      });
    } else if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      });
    } else {
      await route.continue();
    }
  });

  // ── Session fund (POST /api/v2/sessions/fund) ────────────────────────────────
  await page.route('**/api/v2/sessions/fund', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FUND_RESPONSE),
    }),
  );

  // ── Providers (GET /api/v2/providers*) ───────────────────────────────────────
  await page.route('**/api/v2/providers**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ object: 'list', data: MOCK_PROVIDERS, providers: MOCK_PROVIDERS }),
    }),
  );

  // ── Chat completions streaming (POST /api/v2/chat/completions) ───────────────
  await page.route('**/api/v2/chat/completions', (route) => {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream) {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: buildMockStreamChunks(),
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming — return immediately
      import('./fixtures').then(({ MOCK_CHAT_RESPONSE }) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CHAT_RESPONSE),
        });
      });
    }
  });

  // ── Settlement proxy (POST /api/settle) ─────────────────────────────────────
  await page.route('**/api/settle', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SETTLE_RESPONSE),
    }),
  );

  // ── Fund proxy (POST /api/fund) ──────────────────────────────────────────────
  await page.route('**/api/fund', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FUND_RESPONSE),
    }),
  );

  // ── Balance (GET /api/balance*) ──────────────────────────────────────────────
  await page.route('**/api/balance**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session_id: MOCK_SESSION.id,
        balance_usdc: MOCK_SESSION.balance_usdc,
        budget_total: MOCK_SESSION.budget.total_usd,
        budget_spent: MOCK_SESSION.budget.used_usd,
        budget_remaining: MOCK_SESSION.balance_usdc,
        status: 'active',
      }),
    }),
  );

  // ── Analytics (GET /api/v2/analytics/*) ─────────────────────────────────────
  await page.route('**/api/v2/analytics/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        period: '30d',
        total_spent: 2.5,
        total_saved: 7.5,
        request_count: 42,
        recommendations: [],
      }),
    }),
  );
}

/**
 * Mock a failed settlement — 402 / signature error.
 */
export async function mockSettleFail(page: Page, message = 'Signature verification failed') {
  await page.route('**/api/settle', (route) =>
    route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    }),
  );
}

/**
 * Mock a 402 on chat — insufficient balance.
 */
export async function mockChatInsufficientBalance(page: Page) {
  await page.route('**/api/v2/chat/completions', (route) =>
    route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { type: 'insufficient_balance', message: 'Session balance too low', code: 'INSUFFICIENT_BALANCE' },
      }),
    }),
  );
}

/**
 * Simulate the network being offline for a specific route.
 */
export async function mockNetworkError(page: Page, urlPattern: string) {
  await page.route(urlPattern, (route: Route) => route.abort('failed'));
}
