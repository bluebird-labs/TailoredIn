import { expect, test } from '@playwright/test';

test.describe('Headlines Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/headlines');
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Headlines' })).toBeVisible();
  });

  test('lists all seeded headlines', async ({ page }) => {
    await expect(page.getByText('Staff Engineer')).toBeVisible();
    await expect(page.getByText('Engineering Manager')).toBeVisible();
    await expect(page.getByText('Full-Stack Developer')).toBeVisible();
    await expect(page.getByText('deep expertise in distributed systems')).toBeVisible();
  });

  test('create a new headline', async ({ page }) => {
    await page.getByRole('button', { name: 'Add headline variant' }).click();

    await page.getByPlaceholder('Headline label').fill('Principal Engineer');
    await page.getByPlaceholder('1–3 sentence professional summary').fill('Architecture leader driving technical strategy.');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Principal Engineer')).toBeVisible();
    await expect(page.getByText('Architecture leader driving technical strategy.')).toBeVisible();
  });

  test('edit a headline', async ({ page }) => {
    // Hover to reveal edit button on the first headline card
    const firstCard = page.locator('div.border.rounded-lg').filter({ hasText: 'Staff Engineer' }).first();
    await firstCard.hover();

    // Click the pencil/edit icon
    await firstCard.locator('button').filter({ has: page.locator('svg') }).first().click();

    // Edit the label
    const labelInput = page.locator('input.font-medium').first();
    await labelInput.clear();
    await labelInput.fill('Distinguished Engineer');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Distinguished Engineer')).toBeVisible();
  });

  test('delete a headline', async ({ page }) => {
    // First, create one so we can safely delete it
    await page.getByRole('button', { name: 'Add headline variant' }).click();
    await page.getByPlaceholder('Headline label').fill('Temp Headline');
    await page.getByPlaceholder('1–3 sentence professional summary').fill('To be deleted.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Temp Headline')).toBeVisible();

    // Hover and delete
    const card = page.locator('div.border.rounded-lg').filter({ hasText: 'Temp Headline' });
    await card.hover();
    await card.locator('button.text-destructive').click();

    await expect(page.getByText('Temp Headline')).not.toBeVisible();
  });

  test('validation: empty label shows error', async ({ page }) => {
    await page.getByRole('button', { name: 'Add headline variant' }).click();
    // Leave label empty, try to save
    await page.getByRole('button', { name: 'Save' }).click();

    // Should show error toast
    await expect(page.getByText('Label is required')).toBeVisible();
  });
});
