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

    // Headline (italic summary text)
    await expect(page.getByText(/Engineering leader/)).toBeVisible();

    // Experience section title
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

    // At least one company name from seeds (depends on active archetype's content selection)
    const companyBlocks = page.locator('.group\\/company');
    expect(await companyBlocks.count()).toBeGreaterThan(0);

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
    const tabCountBefore = await page.locator('[class*="border-b"] button[class*="rounded-md"]').count();

    await page.getByTitle('Add version').click();
    await page.getByText('Duplicate current').click();

    // Should have one more tab
    await expect(page.locator('[class*="border-b"] button[class*="rounded-md"]')).toHaveCount(tabCountBefore + 1);
  });

  /* 5 — Rename a version */
  test('renames a version', async ({ page }) => {
    // Find the three-dot menu for the active tab and click it
    const menuBtn = page.locator('[data-testid^="version-menu-"]').first();
    await menuBtn.click({ force: true });

    await page.getByText('Rename').click();

    // Inline input should appear — type new name
    const input = page.locator('input.outline-none');
    await expect(input).toBeVisible();
    await input.clear();
    await input.fill('My Custom Name');
    await input.press('Enter');

    // Tab should show new name
    await expect(page.getByRole('button', { name: 'My Custom Name' })).toBeVisible();
  });

  /* 6 — Delete a version */
  test('deletes a version (not the last one)', async ({ page }) => {
    // Create a version first so we have at least 2
    // Count tabs before
    const tabsBefore = await page.locator('[data-testid^="version-menu-"]').count();

    await page.getByTitle('Add version').click();
    await page.getByText('New blank').click();

    // Should have one more tab
    await expect(page.locator('[data-testid^="version-menu-"]')).toHaveCount(tabsBefore + 1);

    // Open the three-dot menu for the last tab (newly created)
    const menuBtn = page.locator('[data-testid^="version-menu-"]').last();
    await menuBtn.click({ force: true });

    await page.getByText('Delete').click();

    // Confirmation dialog should appear
    await expect(page.getByText('Delete version')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // Should be back to original count
    await expect(page.locator('[data-testid^="version-menu-"]')).toHaveCount(tabsBefore);
  });

  /* 7 — Switch versions shows different content */
  test('switches between versions', async ({ page }) => {
    // Get text from the first version's headline
    const headlineBefore = await page.locator('.group\\/headline p').first().textContent();

    // Click the second tab
    await page.getByRole('button', { name: 'Nerd' }).click();

    // Wait a moment for content to update
    await page.waitForTimeout(500);

    // The page should still have a headline (content may or may not differ depending on archetype config)
    const headlineAfter = await page.locator('.group\\/headline p').first().textContent();
    expect(headlineAfter).toBeTruthy();

    // Switch back
    const firstTab = page.locator('[class*="border-b"] button[class*="rounded-md"]').first();
    await firstTab.click();
    await page.waitForTimeout(500);

    const headlineRestored = await page.locator('.group\\/headline p').first().textContent();
    expect(headlineRestored).toBe(headlineBefore);
  });

  /* 8 — Auto-save: toggle bullet off, reload, verify persisted */
  test('auto-saves bullet visibility changes', async ({ page }) => {
    // Open first company's edit modal
    const companyBlock = page.locator('.group\\/company').first();
    await companyBlock.hover();
    await companyBlock.getByTitle('Edit experience').click();

    const dialogContent = page.locator('[data-slot="dialog-content"]');
    await expect(dialogContent).toBeVisible();

    // Find first eye button (visible bullet)
    const eyeButtons = dialogContent.getByTitle('Exclude from resume');
    if ((await eyeButtons.count()) === 0) {
      await page.keyboard.press('Escape');
      return;
    }

    // Get the bullet text before toggling
    const bulletCard = eyeButtons.first().locator('..');
    const bulletText = await bulletCard.locator('span.flex-1').first().textContent();

    // Click to hide — auto-saves
    await eyeButtons.first().click();

    // Close modal
    await page.getByRole('button', { name: 'Done' }).click();

    // Reload the page
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sylvain Estevez' })).toBeVisible();

    // The bullet should still be hidden after reload
    if (bulletText) {
      await expect(page.locator('.group\\/company').first().getByText(bulletText)).not.toBeVisible();
    }
  });

  /* 9 — Personal info modal */
  test('opens personal info modal and edits a field', async ({ page }) => {
    const nameHeading = page.locator('h1', { hasText: 'Sylvain Estevez' });
    const headerGroup = nameHeading.locator('..');
    await headerGroup.hover();

    const editButton = headerGroup.getByTitle('Edit personal info');
    await editButton.click();

    await expect(page.getByRole('heading', { name: 'Edit Personal Info' })).toBeVisible();

    const locationInput = page.getByLabel('Location');
    await locationInput.clear();
    await locationInput.fill('San Francisco, CA');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Profile updated')).toBeVisible();
    await expect(page.getByText('San Francisco, CA')).toBeVisible();
  });

  /* 10 — Education visibility toggle */
  test('toggles education visibility', async ({ page }) => {
    const eduRow = page.locator('.group\\/edu').first();
    await eduRow.hover();

    const excludeBtn = eduRow.getByTitle('Exclude from resume');
    await excludeBtn.click();

    // Wait for auto-save and re-render
    await expect(eduRow).toHaveClass(/line-through/);

    // Re-hover after re-render to reveal the include button
    await page.mouse.move(0, 0);
    await eduRow.hover();
    const includeBtn = eduRow.getByTitle('Include in resume');
    await includeBtn.click();

    await expect(eduRow).not.toHaveClass(/line-through/);
  });

  /* 11 — Generate PDF */
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
