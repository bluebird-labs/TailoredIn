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
    // Education displays as content cards (EducationCardContent); check for rendered text.
    await expect(page.getByText('Stanford University')).toBeVisible();
    await expect(page.getByText('Carnegie Mellon University')).toBeVisible();
    await expect(page.getByText('B.S. Computer Science')).toBeVisible();
    await expect(page.getByText('M.S. Software Engineering')).toBeVisible();
    await expect(page.getByText(/2020/)).toBeVisible();
    await expect(page.getByText('Magna Cum Laude')).toBeVisible();
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
