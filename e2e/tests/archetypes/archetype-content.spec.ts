import { expect, test } from '@playwright/test';

test.describe('Archetype content selection', () => {
  // Tests modify the same archetype — run serially to avoid race conditions
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/archetypes');
    await expect(page.getByRole('heading', { name: 'Archetypes' })).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: 'Lead IC' });
    await row.locator('a[href^="/archetypes/"]').click();

    await expect(page.getByRole('heading', { name: 'Lead IC' })).toBeVisible();
    await expect(page.getByText('Content Selection', { exact: true })).toBeVisible();
  });

  test('content selection loads with experience checkboxes and variant pickers', async ({ page }) => {
    // Experiences section
    await expect(page.getByRole('heading', { name: 'Experiences' })).toBeVisible();
    await expect(page.getByText('Staff Software Engineer at Stealth Startup')).toBeVisible();
    await expect(page.getByText('Staff Software Engineer at Brightflow.ai')).toBeVisible();
    await expect(page.getByText('Tech Lead Manager at Volvo Cars')).toBeVisible();
    await expect(page.getByText('Software Engineer at LuckyCart')).toBeVisible();

    // Education section
    await expect(page.getByText('B.S. in Computer Science')).toBeVisible();

    // Skills section
    await expect(page.getByText('architecture', { exact: true })).toBeVisible();
    await expect(page.getByText('backend', { exact: true })).toBeVisible();
    await expect(page.getByText('frontend', { exact: true })).toBeVisible();

    // Save button
    await expect(page.getByRole('button', { name: 'Save content selection' })).toBeVisible();
  });

  test('selects an experience and persists across reload', async ({ page }) => {
    // LuckyCart experience is pre-selected in Lead IC seed — uncheck it
    const luckyCartRow = page
      .locator('div')
      .filter({ hasText: /^Software Engineer at LuckyCart$/ })
      .first();
    const luckyCartCheckbox = luckyCartRow.getByRole('checkbox');
    await expect(luckyCartCheckbox).toBeChecked();

    await luckyCartCheckbox.uncheck();
    await expect(luckyCartCheckbox).not.toBeChecked();

    // Save and wait for API response
    const saveResponse = page.waitForResponse(resp => resp.url().includes('/content') && resp.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Save content selection' }).click();
    await saveResponse;

    // Reload and verify it stayed unchecked
    await page.reload();
    await expect(page.getByText('Content Selection', { exact: true })).toBeVisible();

    const luckyCartRowAfter = page
      .locator('div')
      .filter({ hasText: /^Software Engineer at LuckyCart$/ })
      .first();
    await expect(luckyCartRowAfter.getByRole('checkbox')).not.toBeChecked();

    // Re-check to restore seed state for other tests
    await luckyCartRowAfter.getByRole('checkbox').check();
    const restoreResponse = page.waitForResponse(resp => resp.url().includes('/content') && resp.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Save content selection' }).click();
    await restoreResponse;
  });

  test('shows bullet content when experience is checked', async ({ page }) => {
    // Stealth Startup experience is checked — its bullets should be visible
    await expect(
      page.getByText('Leveraged LLMs (OpenAI, Anthropic)', { exact: false })
    ).toBeVisible();

    // Uncheck Stealth Startup — bullets should disappear
    const stealthRow = page
      .locator('div')
      .filter({ hasText: /^Staff Software Engineer at Stealth Startup$/ })
      .first();
    await stealthRow.getByRole('checkbox').uncheck();

    await expect(
      page.getByText('Leveraged LLMs (OpenAI, Anthropic)', { exact: false })
    ).not.toBeVisible();

    // Re-check to restore
    await stealthRow.getByRole('checkbox').check();
    await expect(
      page.getByText('Leveraged LLMs (OpenAI, Anthropic)', { exact: false })
    ).toBeVisible();
  });

  test('selects education entries and persists across reload', async ({ page }) => {
    // Lead IC seed has only educationIndices: [0] = "B.S. in Computer Science"
    // "Certification in Modern Management Techniques" should be unchecked
    const certRow = page
      .locator('div')
      .filter({ hasText: /^Certification in Modern Management Techniques/ })
      .first();
    const certCheckbox = certRow.getByRole('checkbox');
    await expect(certCheckbox).not.toBeChecked();

    // Check it
    await certCheckbox.check();
    await expect(certCheckbox).toBeChecked();

    // Save and wait for API response
    const saveResponse = page.waitForResponse(resp => resp.url().includes('/content') && resp.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Save content selection' }).click();
    await saveResponse;

    // Reload and verify
    await page.reload();
    await expect(page.getByText('Content Selection', { exact: true })).toBeVisible();

    const certRowAfter = page
      .locator('div')
      .filter({ hasText: /^Certification in Modern Management Techniques/ })
      .first();
    await expect(certRowAfter.getByRole('checkbox')).toBeChecked();

    // Also verify the original one is still checked
    const bsCheckbox = page
      .getByText(/B\.S\. in Computer Science/)
      .locator('..')
      .getByRole('checkbox');
    await expect(bsCheckbox).toBeChecked();

    // Restore: uncheck the cert entry
    await certRowAfter.getByRole('checkbox').uncheck();
    const restoreResponse = page.waitForResponse(resp => resp.url().includes('/content') && resp.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Save content selection' }).click();
    await restoreResponse;
  });

  test('selects skill categories and items and persists across reload', async ({ page }) => {
    // All categories are pre-selected in the seed — uncheck "interests"
    const interestsRow = page
      .locator('div')
      .filter({ hasText: /^interests$/i })
      .first();
    const interestsCheckbox = interestsRow.getByRole('checkbox');
    await expect(interestsCheckbox).toBeChecked();

    await interestsCheckbox.uncheck();
    await expect(interestsCheckbox).not.toBeChecked();

    // Save and wait for API response
    const saveResponse = page.waitForResponse(resp => resp.url().includes('/content') && resp.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Save content selection' }).click();
    await saveResponse;

    // Reload and verify
    await page.reload();
    await expect(page.getByText('Content Selection', { exact: true })).toBeVisible();

    const interestsRowAfter = page
      .locator('div')
      .filter({ hasText: /^interests$/i })
      .first();
    await expect(interestsRowAfter.getByRole('checkbox')).not.toBeChecked();

    // Verify another category is still checked
    const backendRow = page
      .locator('div')
      .filter({ hasText: /^backend$/i })
      .first();
    await expect(backendRow.getByRole('checkbox')).toBeChecked();

    // Restore: re-check interests
    await interestsRowAfter.getByRole('checkbox').check();
    const restoreResponse = page.waitForResponse(resp => resp.url().includes('/content') && resp.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Save content selection' }).click();
    await restoreResponse;
  });
});
