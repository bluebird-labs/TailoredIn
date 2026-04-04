import { expect, test } from '@playwright/test';

test.describe('Experiences Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/experiences');
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Experiences' })).toBeVisible();
  });

  test('lists all seeded experiences', async ({ page }) => {
    await expect(page.getByText('Acme Corp')).toBeVisible();
    await expect(page.getByText('Senior Engineer')).toBeVisible();
    await expect(page.getByText('StartupCo')).toBeVisible();
    await expect(page.getByText('Software Engineer')).toBeVisible();
  });

  test('shows accomplishment count per experience', async ({ page }) => {
    const acmeCard = page.locator('div.border.rounded-lg').filter({ hasText: 'Acme Corp' });
    await expect(acmeCard.getByText('2 accomplishments')).toBeVisible();

    const startupCard = page.locator('div.border.rounded-lg').filter({ hasText: 'StartupCo' });
    await expect(startupCard.getByText('1 accomplishments')).toBeVisible();
  });

  test('expand experience shows narrative and accomplishments', async ({ page }) => {
    // Click Acme Corp to expand
    await page.getByText('Acme Corp').click();

    // Narrative section should appear
    await expect(page.getByText('Role Narrative')).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();

    // Accomplishments should appear
    await expect(page.getByText('Migrated to Kubernetes')).toBeVisible();
    await expect(page.getByText('Reduced API latency by 40%')).toBeVisible();
  });

  test('collapse experience hides details', async ({ page }) => {
    // Expand
    await page.getByText('Acme Corp').click();
    await expect(page.getByText('Migrated to Kubernetes')).toBeVisible();

    // Collapse
    await page.getByText('Acme Corp').click();
    await expect(page.getByText('Migrated to Kubernetes')).not.toBeVisible();
  });

  test('expand shows add accomplishment button', async ({ page }) => {
    await page.getByText('Acme Corp').click();
    await expect(page.getByRole('button', { name: 'Add accomplishment' })).toBeVisible();
  });
});
