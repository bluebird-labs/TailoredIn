import { expect, test } from '@playwright/test';

test.describe('Headlines Page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/headlines');
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Headlines' })).toBeVisible();
  });

  test('lists all seeded headlines', async ({ page }) => {
    // Headlines display as content cards (HeadlineCardContent); check for rendered text.
    await expect(page.getByText('Staff Engineer')).toBeVisible();
    await expect(page.getByText('Engineering Manager')).toBeVisible();
    await expect(page.getByText('Full-Stack Developer')).toBeVisible();
    await expect(page.getByText(/deep expertise in distributed systems/)).toBeVisible();
  });

  test('create a new headline', async ({ page }) => {
    await page.getByRole('button', { name: 'Add headline' }).click();

    // The inline create form has a highlighted border
    const createForm = page.locator('div.border-primary\\/30');
    await createForm.getByLabel('Label').fill('Principal Engineer');
    await createForm.getByLabel('Summary').fill('Architecture leader driving technical strategy.');

    await createForm.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Headline created')).toBeVisible();
    // New card appears with the value in an input
    await expect(page.locator('input[value="Principal Engineer"]')).toBeVisible();
  });

  test('edit a headline', async ({ page }) => {
    // Use the last seeded card (Full-Stack Developer at nth(2)) to avoid conflicts with create test
    const card = page.locator('div.border.rounded-lg').nth(2);
    const originalValue = await card.getByLabel('Label').inputValue();
    await expect(originalValue).toBeTruthy();

    await card.getByLabel('Label').clear();
    await card.getByLabel('Label').fill('Distinguished Engineer');

    // SaveBar should appear within the card
    await card.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
    await expect(card.getByLabel('Label')).toHaveValue('Distinguished Engineer');
  });

  test('delete a headline', async ({ page }) => {
    // First, create one so we can safely delete it
    await page.getByRole('button', { name: 'Add headline' }).click();
    const createForm = page.locator('div.border-primary\\/30');
    await createForm.getByLabel('Label').fill('Temp Headline');
    await createForm.getByLabel('Summary').fill('To be deleted.');
    await createForm.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('input[value="Temp Headline"]')).toBeVisible();

    // Click delete on the card
    const card = page.locator('div.border.rounded-lg').filter({ has: page.locator('input[value="Temp Headline"]') });
    await card.locator('button.text-destructive').click();

    // Confirm in AlertDialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete headline?')).toBeVisible();
    await alertDialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator('input[value="Temp Headline"]')).not.toBeVisible();
  });

  test('validation: empty label shows error', async ({ page }) => {
    await page.getByRole('button', { name: 'Add headline' }).click();
    const createForm = page.locator('div.border-primary\\/30');
    await createForm.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Label is required')).toBeVisible();
  });
});
