import { expect, test } from '@playwright/test';

test.describe('Resume Wardrobe', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/resume?tab=wardrobe');
    // Wait for experiences tab to load
    await expect(page.getByRole('tab', { name: 'Experience' })).toBeVisible();
  });

  /* 1 — Page renders with seeded experience data */
  test('renders wardrobe with seeded experience data', async ({ page }) => {
    // Experience tab should be active by default
    await expect(page.getByRole('tab', { name: 'Experience' })).toBeVisible();

    // At least one seeded company name should be visible
    await expect(page.getByText('ResortPass')).toBeVisible();
  });

  /* 2 — Tab navigation works */
  test('switches between wardrobe tabs', async ({ page }) => {
    // Click Headlines tab
    await page.getByRole('tab', { name: 'Headlines' }).click();
    await expect(page.getByRole('tab', { name: 'Headlines' })).toHaveAttribute('data-state', 'active');

    // Click Skills tab
    await page.getByRole('tab', { name: 'Skills' }).click();
    await expect(page.getByRole('tab', { name: 'Skills' })).toHaveAttribute('data-state', 'active');

    // Return to Experience tab
    await page.getByRole('tab', { name: 'Experience' }).click();
    await expect(page.getByText('ResortPass')).toBeVisible();
  });

  /* 3 — Factory tab is accessible */
  test('can navigate to factory tab', async ({ page }) => {
    await page.goto('/resume?tab=factory');
    // Factory input step should show a textarea for job description
    await expect(page.getByRole('textbox')).toBeVisible();
  });
});
