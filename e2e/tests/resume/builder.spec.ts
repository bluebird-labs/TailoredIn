import { expect, test } from '@playwright/test';

test.describe('Resume Builder', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/builder');
    // Wait for the page to render with data (name should be visible)
    await expect(page.getByRole('heading', { name: 'Sylvain Estevez' })).toBeVisible();
  });

  /* 1 — Page renders with seeded data */
  test('renders resume preview with seeded data', async ({ page }) => {
    // Name
    await expect(page.getByText('Sylvain Estevez')).toBeVisible();

    // Contact icons (LinkedIn, email, etc.)
    await expect(page.getByText('estevez.sylvain@gmail.com')).toBeVisible();

    // Experience section title
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

    // Education section
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
  });

  /* 2 — Version tabs render with archetypes */
  test('renders version tabs with archetype labels', async ({ page }) => {
    // Seeded archetypes should appear as tabs
    await expect(page.getByRole('button', { name: 'Lead IC' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nerd' })).toBeVisible();

    // "+" button should be visible
    await expect(page.getByTitle('Add version')).toBeVisible();
  });

  /* 3 — Create new blank version */
  test('creates a new blank version', async ({ page }) => {
    // Click "+" button
    await page.getByTitle('Add version').click();
    await page.getByText('New blank').click();

    // New tab should appear
    await expect(page.getByRole('button', { name: 'New Version' })).toBeVisible();
  });

  /* 4 — Duplicate current version */
  test('duplicates current version', async ({ page }) => {
    const tabCountBefore = await page.locator('button[class*="rounded-md"][class*="text-\\[13px\\]"]').count();

    await page.getByTitle('Add version').click();
    await page.getByText('Duplicate current').click();

    // Should have one more tab
    await expect(page.locator('button[class*="rounded-md"][class*="text-\\[13px\\]"]')).toHaveCount(tabCountBefore + 1);
  });

  /* 5 — Rename a version via double-click */
  test('renames a version', async ({ page }) => {
    // Double-click the active tab to enter rename mode
    const activeTab = page.getByRole('button', { name: 'Lead IC' });
    await activeTab.dblclick();

    // Inline input should appear
    const input = page.locator('input.outline-none');
    await expect(input).toBeVisible();
    await input.clear();
    await input.fill('My Custom Name');
    await input.press('Enter');

    // Tab should show new name
    await expect(page.getByRole('button', { name: 'My Custom Name' })).toBeVisible();
  });

  /* 6 — Delete a version (not the last one) */
  test('deletes a version (not the last one)', async ({ page }) => {
    // Create a version first so we have extra
    await page.getByTitle('Add version').click();
    await page.getByText('New blank').click();
    await expect(page.getByRole('button', { name: 'New Version' })).toBeVisible();

    // Click the new tab to make it active
    await page.getByRole('button', { name: 'New Version' }).click();

    // Hover over the active tab group to reveal the delete X
    const tabGroup = page.locator('.group\\/tab').last();
    await tabGroup.hover();
    await tabGroup.getByTitle('Delete version').click();

    // Confirmation dialog should appear
    await expect(page.getByText('Delete version')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // "New Version" tab should be gone
    await expect(page.getByRole('button', { name: 'New Version' })).not.toBeVisible();
  });

  /* 7 — Switch versions */
  test('switches between versions', async ({ page }) => {
    // Click the second tab
    await page.getByRole('button', { name: 'Nerd' }).click();
    await page.waitForTimeout(500);

    // Page should still render content
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

    // Switch back
    const firstTab = page.locator('button[class*="rounded-md"][class*="text-\\[13px\\]"]').first();
    await firstTab.click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();
  });

  /* 8 — Education visibility toggle */
  test('toggles education visibility', async ({ page }) => {
    // Find first education entry and hover to reveal eye icon
    const eduEntry = page.locator('.group\\/edu').first();
    await eduEntry.hover();

    const toggleBtn = eduEntry.getByTitle('Hide from resume');
    await toggleBtn.click();

    // The text should get strikethrough
    const innerBtn = eduEntry.locator('button').first();
    await expect(innerBtn).toHaveClass(/line-through/);

    // Re-hover and toggle back
    await page.mouse.move(0, 0);
    await eduEntry.hover();
    await eduEntry.getByTitle('Show on resume').click();

    await expect(innerBtn).not.toHaveClass(/line-through/);
  });

  /* 9 — Generate PDF */
  test('generates a resume PDF', async ({ page }) => {
    const captured: { status: number; contentType: string; bodyLength: number }[] = [];
    await page.route('**/resumes/generate', async route => {
      const response = await route.fetch();
      const body = await response.body();
      captured.push({
        status: response.status(),
        contentType: response.headers()['content-type'] ?? '',
        bodyLength: body.length
      });
      await route.fulfill({ response });
    });

    await page.getByRole('button', { name: 'Generate PDF' }).click();
    await expect(page.getByText('Resume downloaded')).toBeVisible({ timeout: 60_000 });

    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe(200);
    expect(captured[0].contentType).toContain('application/pdf');
    expect(captured[0].bodyLength).toBeGreaterThan(100);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
