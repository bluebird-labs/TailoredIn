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
    // Wait for modal to close and new card to appear as content
    await expect(page.locator('[data-testid^="editable-section-education-"]').filter({ hasText: 'MIT' })).toBeVisible();
    await expect(page.getByText('Ph.D. Artificial Intelligence')).toBeVisible();
  });

  test('edit an education', async ({ page }) => {
    // Wait for content-first cards to load (button = display mode)
    const displayCard = page
      .locator('button[data-testid^="editable-section-education-"]')
      .filter({ hasText: 'Stanford University' });
    await expect(displayCard).toBeVisible();

    // Grab the testid before clicking (we'll need it to find the edit div)
    const testId = await displayCard.getAttribute('data-testid');
    await displayCard.click();

    // Now in edit mode — the section is a div with the same testid
    const editSection = page.locator(`div[data-testid="${testId}"]`);
    await editSection.getByLabel('Degree').clear();
    await editSection.getByLabel('Degree').fill('B.A. Computer Science');

    await editSection.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
    await expect(page.getByText('B.A. Computer Science')).toBeVisible();
  });

  test('delete an education', async ({ page }) => {
    // Create one to safely delete
    await page.getByRole('button', { name: 'Add education' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Institution').fill('Temp University');
    await dialog.getByLabel('Degree').fill('Temp Degree');
    await dialog.getByLabel('Graduation Year').fill('2000');
    await dialog.getByRole('button', { name: 'Save' }).click();
    // After create, new card appears as content text (not an input)
    await expect(page.getByText('Temp University')).toBeVisible();

    // Find the display card (button) and click to enter edit mode
    const displayCard = page
      .locator('button[data-testid^="editable-section-education-"]')
      .filter({ hasText: 'Temp University' });
    const testId = await displayCard.getAttribute('data-testid');
    await displayCard.click();

    // Click the delete button in the edit section (div with same testid)
    const editSection = page.locator(`div[data-testid="${testId}"]`);
    await editSection.locator('button.text-destructive').click();

    // Confirm in AlertDialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete education?')).toBeVisible();
    await alertDialog.getByRole('button', { name: 'Delete' }).click();

    // Education text is gone from the page
    await expect(page.getByText('Temp University')).not.toBeVisible();
  });
});
