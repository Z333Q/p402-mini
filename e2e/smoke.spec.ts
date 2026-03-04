/**
 * @smoke
 * Smoke tests — the app must load and render something meaningful
 * on every route, with and without a wallet.
 */
import { test, expect } from '@playwright/test';
import { mockP402Api } from './helpers/mock-api';
import { buildPersistedStore } from './helpers/fixtures';

test.describe('Smoke — unauthenticated @smoke', () => {
  test('root page loads and shows Farcaster gate or loading screen', async ({ page }) => {
    await page.goto('/');

    // Either the loading spinner or the Farcaster gate should be visible
    const hasLoader = page.locator('text=Loading...').or(
      page.locator('.animate-pulse'),
    );
    const hasFarcasterGate = page.locator('text=Open in Farcaster');

    // Wait for one of them to appear
    await expect(hasLoader.or(hasFarcasterGate).first()).toBeVisible({ timeout: 10_000 });
  });

  test('browser fallback screen is shown when not inside Farcaster @smoke', async ({ page }) => {
    await page.goto('/');

    // The app detects it's not inside Farcaster and shows the fallback
    await expect(page.locator('text=Open in Farcaster')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=P402 Mini requires Farcaster')).toBeVisible();
  });

  test('browser fallback contains Open in Farcaster link @smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Open in Farcaster')).toBeVisible({ timeout: 10_000 });

    // The href link should point to Warpcast
    const link = page.locator('a[href*="warpcast.com"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('warpcast.com');
    expect(href).toContain('mini-app');
  });

  test('browser fallback has copy link button @smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Open in Farcaster')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Copy link")')).toBeVisible();
  });

  test('page has correct title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/p402/i);
  });
});

test.describe('Smoke — authenticated @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Seed Zustand persisted state so the app auto-reconnects
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    // Mock all API calls before navigation
    await mockP402Api(page);
    await page.goto('/');
  });

  test('main app renders after auto-reconnect @smoke', async ({ page }) => {
    // The header with P402 branding should be visible
    await expect(page.locator('header')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=P402').first()).toBeVisible();
  });

  test('header shows SDK version badge @smoke', async ({ page }) => {
    await expect(page.locator('text=SDK // v2')).toBeVisible({ timeout: 15_000 });
  });

  test('balance button is visible in header @smoke', async ({ page }) => {
    await expect(page.locator('text=Balance')).toBeVisible({ timeout: 15_000 });
  });

  test('chat and audit tabs are visible @smoke', async ({ page }) => {
    await expect(page.locator('text=Chat').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Audit').first()).toBeVisible();
  });

  test('chat empty state is visible @smoke', async ({ page }) => {
    await expect(page.locator('text=System Ready')).toBeVisible({ timeout: 15_000 });
  });

  test('chat input is rendered @smoke', async ({ page }) => {
    await expect(page.locator('textarea')).toBeVisible({ timeout: 15_000 });
  });

  test('status bar shows READY @smoke', async ({ page }) => {
    await expect(page.locator('text=STATUS: READY')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Smoke — well-known and API routes @smoke', () => {
  test('farcaster manifest endpoint responds with JSON @smoke', async ({ page }) => {
    const response = await page.request.get('/.well-known/farcaster.json');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accountAssociation');
    expect(body).toHaveProperty('frame');
  });

  test('health check endpoint is reachable @smoke', async ({ page }) => {
    // The app has API routes — check that the Next.js server is healthy
    const response = await page.request.get('/');
    expect(response.status()).toBe(200);
  });
});
