import { expect, test } from '@playwright/test';

test.describe('Education CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/education');
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
  });

  test('creates a new education entry', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Entry' }).click();
    await expect(page.getByRole('heading', { name: 'Add Education' })).toBeVisible();

    await page.getByLabel('Degree').fill('B.S. Computer Science');
    await page.getByLabel('Institution').fill('MIT');
    await page.getByLabel('Graduation Year').fill('2020');
    await page.getByLabel('Location').fill('Cambridge, MA');
    await page.getByLabel('Honors').fill('Magna Cum Laude');
    await page.getByRole('button', { name: 'Add Education' }).click();

    await expect(page.getByText('Education added')).toBeVisible();
    await expect(page.getByText('B.S. Computer Science')).toBeVisible();
    await expect(page.getByText('MIT')).toBeVisible();
  });

  test('deletes an education entry', async ({ page }) => {
    // First create an entry to delete
    await page.getByRole('button', { name: 'Add Entry' }).click();
    await page.getByLabel('Degree').fill('M.A. Philosophy');
    await page.getByLabel('Institution').fill('Oxford');
    await page.getByLabel('Graduation Year').fill('2022');
    await page.getByRole('button', { name: 'Add Education' }).click();
    await expect(page.getByText('Education added')).toBeVisible();

    // Find the card with the degree title and click the delete (second) button
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'M.A. Philosophy' });
    await card.getByRole('button').nth(1).click();

    await expect(page.getByText('Delete M.A. Philosophy?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('M.A. Philosophy deleted')).toBeVisible();
    // Verify the card is gone (use exact match to avoid matching the toast text)
    await expect(page.locator('[data-slot="card"]').filter({ hasText: 'M.A. Philosophy' })).not.toBeVisible();
  });

  test('persists education entries across page reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Entry' }).click();
    await page.getByLabel('Degree').fill('Ph.D. Mathematics');
    await page.getByLabel('Institution').fill('Stanford');
    await page.getByLabel('Graduation Year').fill('2024');
    await page.getByRole('button', { name: 'Add Education' }).click();
    await expect(page.getByText('Education added')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
    await expect(page.getByText('Ph.D. Mathematics')).toBeVisible();
    await expect(page.getByText('Stanford')).toBeVisible();
  });
});
