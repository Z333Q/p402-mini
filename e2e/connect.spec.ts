/**
 * Connection flow tests.
 * Covers the browser fallback (non-Farcaster) and the auto-reconnect
 * path that fires when walletAddress is persisted in localStorage.
 */
import { test, expect } from '@playwright/test';
import { mockP402Api } from './helpers/mock-api';
import { buildPersistedStore, MOCK_WALLET } from './helpers/fixtures';

test.describe('Connect — browser fallback (no Farcaster)', () => {
  test('shows Farcaster gate when not in miniapp', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("Open in Farcaster")')).toBeVisible({ timeout: 10_000 });
  });

  test('gate shows three onboarding steps', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Install Warpcast')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Open the link below in Warpcast')).toBeVisible();
    await expect(page.locator('text=Connect your Base wallet')).toBeVisible();
  });

  test('Warpcast deep link is correctly formed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Open in Farcaster')).toBeVisible({ timeout: 10_000 });

    const link = page.locator('a[href*="warpcast.com"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('mini-app');
    // URL param must encode the app URL
    expect(href).toContain(encodeURIComponent('http'));
  });

  test('copy link button triggers clipboard write', async ({ page, context }) => {
    // Grant clipboard permission
    await context.grantPermissions(['clipboard-write']);
    await page.goto('/');
    await expect(page.locator('text=Open in Farcaster')).toBeVisible({ timeout: 10_000 });

    await page.locator('button:has-text("Copy link")').click();

    // The error-slot message doubles as a success toast here
    await expect(page.locator('text=Link copied!')).toBeVisible({ timeout: 3_000 });
  });

  test('P402.io powered-by link is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Open in Farcaster')).toBeVisible({ timeout: 10_000 });

    const link = page.locator('a[href="https://p402.io"]');
    await expect(link).toBeVisible();
  });
});

test.describe('Connect — auto-reconnect from persisted wallet', () => {
  test('reconnects and reaches main UI when wallet is in localStorage', async ({ page }) => {
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    await mockP402Api(page);
    await page.goto('/');

    // Should skip ConnectScreen and reach the header
    await expect(page.locator('text=P402').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=SDK // v2')).toBeVisible();
  });

  test('balance is displayed after reconnect', async ({ page }) => {
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    await mockP402Api(page);
    await page.goto('/');

    // Balance should read $5.00 from the mock session
    await expect(page.locator('text=$5.00')).toBeVisible({ timeout: 15_000 });
  });

  test('connect screen NOT shown when wallet is already persisted', async ({ page }) => {
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    await mockP402Api(page);
    await page.goto('/');

    // Wait for app to settle
    await expect(page.locator('text=System Ready')).toBeVisible({ timeout: 15_000 });

    // The Farcaster gate or connect button should NOT be visible
    await expect(page.locator('button:has-text("CONNECT WALLET")')).not.toBeVisible();
  });

  test('handles API error during reconnect gracefully', async ({ page }) => {
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    // Return 500 from sessions endpoint
    await page.route('**/api/v2/sessions**', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) }),
    );

    await page.goto('/');

    // App should still load (isReady=true) — shows connect screen or fallback, not a crash
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    // No unhandled exception dialog
    await expect(page.locator('text=Application error')).not.toBeVisible();
  });

  test('clearing localStorage shows Farcaster gate on next load', async ({ page }) => {
    // First load with wallet persisted
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    await mockP402Api(page);
    await page.goto('/');
    await expect(page.locator('text=System Ready')).toBeVisible({ timeout: 15_000 });

    // Clear storage and reload
    await page.evaluate(() => localStorage.removeItem('p402-miniapp-storage'));
    await page.reload();

    // Now no wallet — should show Farcaster gate
    await expect(page.locator('text=Open in Farcaster')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Connect — wallet address handling', () => {
  test('wallet address stored in persisted state matches mock', async ({ page }) => {
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore(MOCK_WALLET));

    await mockP402Api(page);
    await page.goto('/');

    await expect(page.locator('text=System Ready')).toBeVisible({ timeout: 15_000 });

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('p402-miniapp-storage');
      return raw ? JSON.parse(raw) : null;
    });

    expect(stored?.state?.walletAddress).toBe(MOCK_WALLET);
  });
});
