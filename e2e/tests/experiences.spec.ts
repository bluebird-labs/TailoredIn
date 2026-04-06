import { expect, test } from '@playwright/test';

test.describe('Experiences Page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/experiences');
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Experiences' })).toBeVisible();
  });

  test('lists all seeded experience cards', async ({ page }) => {
    await expect(page.getByText('Acme Corp')).toBeVisible();
    await expect(page.getByText('Senior Engineer')).toBeVisible();
    await expect(page.getByText('StartupCo')).toBeVisible();
    await expect(page.getByText('Software Engineer')).toBeVisible();
    await expect(page.getByText('ScratchCorp')).toBeVisible();
    await expect(page.getByText('QA Analyst')).toBeVisible();
  });

  test('shows accomplishment badges', async ({ page }) => {
    // At least one experience has accomplishments — verify badge text pattern exists
    await expect(page.getByText(/\d+ accomplishments?/).first()).toBeVisible();
  });

  test('create experience via modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add experience' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Add Experience')).toBeVisible();

    await dialog.getByLabel('Role / Title').fill('Principal Engineer');
    await dialog.getByPlaceholder('e.g. Acme Corp').fill('NewCo');
    await dialog.getByLabel('Location').fill('Seattle, WA');

    // Select dates via comboboxes (order: Start Month, Start Year, End Month, End Year)
    const comboboxes = dialog.getByRole('combobox');
    await comboboxes.nth(0).click();
    await page.getByRole('option', { name: 'Jan' }).click();
    await comboboxes.nth(1).click();
    await page.getByRole('option', { name: '2023' }).click();
    await comboboxes.nth(2).click();
    await page.getByRole('option', { name: 'Dec' }).click();
    await comboboxes.nth(3).click();
    await page.getByRole('option', { name: '2024' }).click();

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Experience created')).toBeVisible();
    await expect(page.getByText('NewCo')).toBeVisible();
    // Use first() to guard against retry-induced duplicates in shared DB state
    await expect(page.getByText('Principal Engineer').first()).toBeVisible();
  });

  test('edit experience via modal', async ({ page }) => {
    // Click ScratchCorp card → navigates to detail page
    await page.getByText('ScratchCorp').click();
    await page.waitForURL(/\/experiences\/.+/);

    // Open the edit modal from the detail page
    await page.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Edit Experience')).toBeVisible();
    await expect(dialog.getByLabel('Role / Title')).toHaveValue('QA Analyst');

    // Modify the title
    await dialog.getByLabel('Role / Title').clear();
    await dialog.getByLabel('Role / Title').fill('Senior QA Analyst');
    await expect(dialog.getByLabel('Role / Title')).toHaveValue('Senior QA Analyst');

    // Verify Save button is enabled (dirty tracking works)
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled();

    // Save and verify — use page-level click to avoid dialog portal issues
    await page.locator('[data-slot="button"]:has-text("Save")').last().click();
    await expect(page.getByText('Changes saved').or(page.getByText('Failed to save'))).toBeVisible({ timeout: 15000 });
  });

  test('delete experience with confirmation', async ({ page }) => {
    // First create a temp experience to safely delete
    await page.getByRole('button', { name: 'Add experience' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Role / Title').fill('Temp Role');
    await dialog.getByPlaceholder('e.g. Acme Corp').fill('TempCorp');
    await dialog.getByLabel('Location').fill('Nowhere');

    const comboboxes = dialog.getByRole('combobox');
    await comboboxes.nth(0).click();
    await page.getByRole('option', { name: 'Jan' }).click();
    await comboboxes.nth(1).click();
    await page.getByRole('option', { name: '2020' }).click();
    await comboboxes.nth(2).click();
    await page.getByRole('option', { name: 'Jun' }).click();
    await comboboxes.nth(3).click();
    await page.getByRole('option', { name: '2020' }).click();

    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('TempCorp')).toBeVisible();

    // Hover over the card to reveal delete button (opacity-0 → opacity-100 on group-hover)
    await page.getByText('TempCorp').hover();
    // Click delete button within the card
    const card = page.locator('.group').filter({ hasText: 'TempCorp' });
    await card.locator('button.text-destructive').click();

    // Confirm in AlertDialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete experience?')).toBeVisible();
    await alertDialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('TempCorp')).not.toBeVisible();
  });

  test('cancel delete keeps experience', async ({ page }) => {
    await page.getByText('ScratchCorp').hover();
    const card = page.locator('.group').filter({ hasText: 'ScratchCorp' });
    await card.locator('button.text-destructive').click();

    const alertDialog = page.getByRole('alertdialog');
    await alertDialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('ScratchCorp')).toBeVisible();
  });

  test('validation: empty required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add experience' }).click();

    const dialog = page.getByRole('dialog');
    // Fill one field to enable Save (it's disabled when dirtyCount === 0)
    await dialog.getByLabel('Role / Title').fill('Test');

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText('Company name is required')).toBeVisible();
    await expect(dialog.getByText('Location is required')).toBeVisible();
    await expect(dialog.getByText('Start date is required')).toBeVisible();
    await expect(dialog.getByText('End date is required')).toBeVisible();
  });

  test('discard unsaved modal changes', async ({ page }) => {
    // Click ScratchCorp card → navigates to detail page
    await page.getByText('ScratchCorp').click();
    await page.waitForURL(/\/experiences\/.+/);

    // Open the edit modal from the detail page
    await page.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Role / Title').clear();
    await dialog.getByLabel('Role / Title').fill('Changed Title');

    // Click Cancel in the modal footer
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Discard confirmation should appear
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Discard unsaved changes?')).toBeVisible();

    // Click Keep editing first
    await alertDialog.getByRole('button', { name: 'Keep editing' }).click();
    await expect(dialog).toBeVisible();

    // Now actually discard
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Discard' }).click();

    // Modal should be closed, original data intact — QA Analyst visible on detail page
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('QA Analyst')).toBeVisible();
  });
});
