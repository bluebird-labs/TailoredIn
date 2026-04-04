import { expect, test } from '@playwright/test';

test.describe('Skills smoke', () => {
  test.beforeEach(async ({ page }) => {
    // /resume/skills redirects to /resume?tab=skills
    await page.goto('/resume?tab=skills');
    await expect(page.getByRole('tab', { name: 'Skills' })).toBeVisible();
  });

  test('loads seeded skill categories', async ({ page }) => {
    const cards = page.locator('[data-slot="card"]');
    await expect(cards).toHaveCount(7);
  });

  test('creates a category, adds a skill, deletes the category', async ({ page }) => {
    // Create category
    await page.getByRole('button', { name: 'Add Category' }).click();
    await expect(page.getByRole('heading', { name: 'Add Category' })).toBeVisible();

    await page.getByLabel('Category Name').fill('E2E Testing');
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Add Category' }).click();

    await expect(page.getByText('Category created')).toBeVisible();

    // Find the new card
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'E2E Testing' });
    await expect(card).toBeVisible();

    // Add a skill item via placeholder input + Enter
    await card.getByPlaceholder('Add a skill...').fill('Playwright');
    await card.getByPlaceholder('Add a skill...').press('Enter');
    await expect(card.getByText('Playwright')).toBeVisible();

    // Delete the category — trash is second button in CardAction
    await card.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Delete E2E Testing?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('E2E Testing deleted')).toBeVisible();
    await expect(card).not.toBeVisible();
  });
});
