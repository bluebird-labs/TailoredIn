import { expect, test } from '@playwright/test';

test.describe('Archetype list smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archetypes/');
    await expect(page.getByRole('heading', { name: 'Archetypes', level: 1 })).toBeVisible();
  });

  test('loads seeded archetypes', async ({ page }) => {
    // 1 header row + 5 data rows = 6 total
    await expect(page.getByRole('row')).toHaveCount(6);
  });

  test('creates and deletes an archetype', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Archetype' }).click();
    await expect(page.getByRole('heading', { name: 'Add Archetype' })).toBeVisible();

    await page.getByLabel('Key').fill('e2e-test');
    await page.getByLabel('Label').fill('E2E Tester');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Archetype created')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'E2E Tester' })).toBeVisible();

    // Eye uses nativeButton={false} render={<Link>}, but Base UI adds role="button"
    // So: Eye (0), Pencil (1), Trash (2)
    const row = page.getByRole('row').filter({ hasText: 'E2E Tester' });
    await row.getByRole('button').nth(2).click();

    // ConfirmDeleteDialog title renders inside DialogTitle (heading role)
    await expect(page.getByText('Delete "E2E Tester"')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Archetype deleted')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'E2E Tester' })).not.toBeVisible();
  });
});
