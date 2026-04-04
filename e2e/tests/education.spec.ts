import { expect, test } from '@playwright/test';

test.describe('Education Page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/education');
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Education' })).toBeVisible();
  });

  test('lists all seeded educations', async ({ page }) => {
    // Education values are in always-editable inputs; check via label-scoped assertions
    const institutionInputs = page.getByRole('textbox', { name: /^Institution/ });
    await expect(institutionInputs.nth(0)).toHaveValue('Stanford University');
    await expect(institutionInputs.nth(1)).toHaveValue('Carnegie Mellon University');

    const degreeInputs = page.getByRole('textbox', { name: /^Degree/ });
    await expect(degreeInputs.nth(0)).toHaveValue('B.S. Computer Science');
    await expect(degreeInputs.nth(1)).toHaveValue('M.S. Software Engineering');

    await expect(page.getByRole('spinbutton', { name: /Graduation Year/ }).nth(0)).toHaveValue('2020');
    await expect(page.locator('input[value="Magna Cum Laude"]')).toBeVisible();
  });

  test('create a new education', async ({ page }) => {
    await page.getByRole('button', { name: 'Add education' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Institution').fill('MIT');
    await dialog.getByLabel('Degree').fill('Ph.D. Artificial Intelligence');
    await dialog.getByLabel('Graduation Year').fill('2025');
    await dialog.getByLabel('Location').fill('Cambridge, MA');

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Education created')).toBeVisible();
    await expect(page.locator('input[value="MIT"]')).toBeVisible();
    await expect(page.locator('input[value="Ph.D. Artificial Intelligence"]')).toBeVisible();
  });

  test('edit an education', async ({ page }) => {
    // Locate the card containing the Stanford input
    const card = page.locator('div.border.rounded-lg').filter({ has: page.locator('input[value="Stanford University"]') });
    const degreeInput = card.getByLabel('Degree');
    await degreeInput.clear();
    await degreeInput.fill('B.A. Computer Science');

    await card.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
    await expect(page.locator('input[value="B.A. Computer Science"]')).toBeVisible();
  });

  test('delete an education', async ({ page }) => {
    // Create one to safely delete
    await page.getByRole('button', { name: 'Add education' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Institution').fill('Temp University');
    await dialog.getByLabel('Degree').fill('Temp Degree');
    await dialog.getByLabel('Graduation Year').fill('2000');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('input[value="Temp University"]')).toBeVisible();

    // Click delete on the card
    const card = page.locator('div.border.rounded-lg').filter({ has: page.locator('input[value="Temp University"]') });
    await card.locator('button.text-destructive').click();

    // Confirm in AlertDialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete education?')).toBeVisible();
    await alertDialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator('input[value="Temp University"]')).not.toBeVisible();
  });
});
