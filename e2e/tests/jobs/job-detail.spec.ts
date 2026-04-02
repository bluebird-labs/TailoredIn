import { expect, test } from '@playwright/test';

test.describe('Job detail smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { name: 'Triage', level: 1 })).toBeVisible();

    // Navigate to the first job
    const firstJobLink = page.locator('table a[href^="/jobs/"]').first();
    await expect(firstJobLink).toBeVisible();
    await firstJobLink.click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+$/);
  });

  test('displays job title and description', async ({ page }) => {
    // Job title as h1
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).not.toHaveText('');

    // Description card — CardTitle renders as <div>
    await expect(page.getByText('Description', { exact: true })).toBeVisible();
  });

  test('has status selector', async ({ page }) => {
    await expect(page.getByText('Status:')).toBeVisible();
  });

  test('back to jobs link works', async ({ page }) => {
    const backLink = page.getByRole('link', { name: 'Back to jobs' });
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page.getByRole('heading', { name: 'Triage', level: 1 })).toBeVisible();
  });
});
