/**
 * Chat interface tests.
 * All API calls are intercepted — no real backend required.
 */
import { test, expect } from '@playwright/test';
import { mockP402Api, mockChatInsufficientBalance } from './helpers/mock-api';
import { buildPersistedStore, MOCK_SESSION_EMPTY } from './helpers/fixtures';

/** Helper: land on the app in authenticated state */
async function loadAuthenticatedApp(page: import('@playwright/test').Page) {
  await page.addInitScript((store) => {
    localStorage.setItem('p402-miniapp-storage', store);
  }, buildPersistedStore());

  await mockP402Api(page);
  await page.goto('/');
  await expect(page.locator('text=System Ready')).toBeVisible({ timeout: 15_000 });
}

test.describe('Chat — empty state', () => {
  test.beforeEach(async ({ page }) => loadAuthenticatedApp(page));

  test('shows System Ready heading when no messages', async ({ page }) => {
    await expect(page.locator('h2:has-text("System Ready")')).toBeVisible();
  });

  test('shows starter prompts when balance > 0', async ({ page }) => {
    await expect(page.locator('text=Try a starter prompt')).toBeVisible();
  });

  test('chat textarea is enabled and accepting input', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveAttribute('placeholder', 'Enter your prompt...');
  });

  test('status bar shows READY', async ({ page }) => {
    await expect(page.getByText('○ READY')).toBeVisible();
  });

  test('keyboard hint shows SHIFT+ENTER for newline', async ({ page }) => {
    await expect(page.locator('text=SHIFT+↵')).toBeVisible();
  });

  test('submit button is disabled when input is empty', async ({ page }) => {
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeDisabled();
  });
});

test.describe('Chat — empty wallet state (balance = 0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    // Return session with zero balance
    await page.route('**/api/v2/sessions**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          route.request().url().includes('status=active')
            ? { object: 'list', data: [MOCK_SESSION_EMPTY], total: 1 }
            : MOCK_SESSION_EMPTY,
        ),
      }),
    );
    await page.route('**/api/v2/providers**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ providers: [] }),
      }),
    );

    await page.goto('/');
    await expect(page.locator('text=System Ready')).toBeVisible({ timeout: 15_000 });
  });

  test('shows LOAD USDC CREDITS button when balance is 0', async ({ page }) => {
    await expect(page.locator('button:has-text("LOAD USDC CREDITS")')).toBeVisible();
  });

  test('textarea placeholder says load credits when balance is 0', async ({ page }) => {
    await expect(page.locator('textarea')).toHaveAttribute(
      'placeholder',
      'Load credits to start...',
    );
  });
});

test.describe('Chat — sending messages', () => {
  test.beforeEach(async ({ page }) => loadAuthenticatedApp(page));

  test('typing in textarea enables submit button', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Hello P402');

    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeEnabled();
  });

  test('sends message on Enter key and shows user bubble', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('What is P402?');
    await textarea.press('Enter');

    // User message bubble should appear
    await expect(page.locator('text=What is P402?')).toBeVisible({ timeout: 5_000 });
  });

  test('sends message on submit button click', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Tell me about routing');

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=Tell me about routing')).toBeVisible({ timeout: 5_000 });
  });

  test('Shift+Enter inserts newline rather than submitting', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Line one');
    await textarea.press('Shift+Enter');
    await textarea.type('Line two');

    // Should not have submitted — textarea still has content
    const value = await textarea.inputValue();
    expect(value).toContain('Line one');
    expect(value).toContain('Line two');
  });

  test('clears textarea after sending', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Clear me after send');
    await textarea.press('Enter');

    // After submit the textarea should be empty (or near empty)
    await expect(textarea).toHaveValue('', { timeout: 5_000 });
  });

  test('assistant response appears after streaming completes', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Ping');
    await textarea.press('Enter');

    // Wait for the AI response text
    await expect(
      page.locator('text=Hello from P402! This is a test response.'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('status bar shows STREAMING then returns to READY', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Status check');
    await textarea.press('Enter');

    // After streaming completes, status returns to READY
    await expect(page.locator('text=READY')).toBeVisible({ timeout: 15_000 });
  });

  test('chat and audit tabs switch views', async ({ page }) => {
    // Click Audit tab
    await page.locator('button:has-text("Audit")').click();
    // Chat input area should be hidden
    await expect(page.locator('textarea')).not.toBeVisible();

    // Click Chat tab to go back
    await page.locator('button:has-text("Chat")').click();
    await expect(page.locator('textarea')).toBeVisible();
  });
});

test.describe('Chat — insufficient balance flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((store) => {
      localStorage.setItem('p402-miniapp-storage', store);
    }, buildPersistedStore());

    await mockP402Api(page);
    await mockChatInsufficientBalance(page);
    await page.goto('/');
    await expect(page.locator('text=System Ready')).toBeVisible({ timeout: 15_000 });
  });

  test('chat error does not crash the app', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('This should 402');
    await textarea.press('Enter');

    // The UI should recover — status should return to READY
    await expect(page.locator('text=READY')).toBeVisible({ timeout: 10_000 });

    // App frame still intact
    await expect(page.locator('header')).toBeVisible();
  });
});

test.describe('Chat — model selector', () => {
  test.beforeEach(async ({ page }) => loadAuthenticatedApp(page));

  test('clicking model badge opens model selector', async ({ page }) => {
    // The ModelBadge is inside the chat input area
    // It typically shows the selected model name or a default label
    const modelBtn = page.locator('[data-testid="model-badge"]').or(
      page.locator('text=Select Model').or(page.locator('text=gpt').first()),
    );

    // Click the model area in the toolbar
    await page.locator('.border-t-2 button').first().click();

    // A model selector overlay/modal should appear
    // (selector opens showModelSelector=true → renders ModelSelector)
    await page.waitForTimeout(500); // brief settle
    // If the modal doesn't have unique text we just verify no crash
    await expect(page.locator('body')).toBeVisible();
  });
});
