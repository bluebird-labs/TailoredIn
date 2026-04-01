import { expect, test } from '@playwright/test';

test.describe('Headlines CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/headlines');
    await expect(page.getByRole('heading', { name: 'Headlines' })).toBeVisible();
  });

  test('creates a new headline', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await expect(page.getByRole('heading', { name: 'Add Headline' })).toBeVisible();

    await page.getByLabel('Label').fill('E2E Test Engineer');
    await page.getByLabel('Summary').fill('Automated testing specialist with Playwright expertise.');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Headline created')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'E2E Test Engineer' })).toBeVisible();
  });

  test('edits an existing headline', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await page.getByLabel('Label').fill('Temp Headline');
    await page.getByLabel('Summary').fill('Temporary summary.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Headline created')).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: 'Temp Headline' });
    await row.getByRole('button').first().click();
    await expect(page.getByRole('heading', { name: 'Edit Headline' })).toBeVisible();

    await page.getByLabel('Label').clear();
    await page.getByLabel('Label').fill('Updated Headline');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Headline updated')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Updated Headline' })).toBeVisible();
  });

  test('deletes a headline', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await page.getByLabel('Label').fill('To Delete');
    await page.getByLabel('Summary').fill('Will be deleted.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Headline created')).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: 'To Delete' });
    await row.getByRole('button').nth(1).click();

    await expect(page.getByText('Are you sure you want to delete')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Headline deleted')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'To Delete' })).not.toBeVisible();
  });

  test('persists headlines across page reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Headline' }).click();
    await page.getByLabel('Label').fill('Persistent Headline');
    await page.getByLabel('Summary').fill('Should survive reload.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Headline created')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Headlines' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Persistent Headline' })).toBeVisible();
  });
});
