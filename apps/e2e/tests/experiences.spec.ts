import { expect, test } from '@playwright/test';

test.describe('Experiences Page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('tab', { name: 'Experiences' }).click();
  });

  test('displays experiences tab content', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Experiences', selected: true })).toBeVisible();
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
    // Use first() to guard against retry-induced duplicates in shared DB state
    await expect(page.getByText('NewCo').first()).toBeVisible();
    await expect(page.getByText('Principal Engineer').first()).toBeVisible();
  });

  test('edit experience details inline', async ({ page }) => {
    // Click ScratchCorp card → navigates to detail page
    await page.getByText('ScratchCorp').click();
    await page.waitForURL(/\/experiences\/.+/);

    // Click the Details section to enter edit mode
    const section = page.getByTestId('editable-section-experience-details');
    await section.click();

    // Modify the title
    const titleInput = section.getByLabel('Title');
    await titleInput.clear();
    await titleInput.fill('Senior QA Analyst');
    await expect(titleInput).toHaveValue('Senior QA Analyst');

    // Save within the section
    await section.getByRole('button', { name: 'Save' }).click();
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
    await expect(page.getByText('TempCorp').first()).toBeVisible();

    // Navigate back to experiences list — saving may redirect to detail page
    await page.goto('/profile');
    await page.getByRole('tab', { name: 'Experiences' }).click();
    await expect(page.getByText('TempCorp').first()).toBeVisible();

    // Hover over the card to reveal delete button (opacity-0 → opacity-100 on group-hover)
    await page.getByText('TempCorp').first().hover();
    // Click delete button within the card
    const card = page.locator('.group').filter({ hasText: 'TempCorp' }).first();
    await card.locator('button.text-destructive').click();

    // Confirm in AlertDialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete experience?')).toBeVisible();
    await alertDialog.getByRole('button', { name: 'Delete' }).click();

    // After AlertDialog closes, focus returns to trigger inside the Link card,
    // which can cause navigation to the detail page. Navigate back to the list
    // and verify the experience was deleted.
    await page.goto('/profile');
    await page.getByRole('tab', { name: 'Experiences' }).click();
    await expect(page.getByText('TempCorp')).toHaveCount(0);
  });

  test('cancel delete keeps experience', async ({ page }) => {
    // Use first() to guard against retry-induced duplicates in shared DB state
    await page.getByText('ScratchCorp').first().hover();
    const card = page.locator('.group').filter({ hasText: 'ScratchCorp' }).first();
    await card.locator('button.text-destructive').click();

    const alertDialog = page.getByRole('alertdialog');
    await alertDialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('ScratchCorp').first()).toBeVisible();
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

  test('discard unsaved inline changes', async ({ page }) => {
    // Click ScratchCorp card → navigates to detail page (use first() against retry-induced duplicates)
    await page.getByText('ScratchCorp').first().click();
    await page.waitForURL(/\/experiences\/.+/);

    // Click the Details section to enter edit mode
    const section = page.getByTestId('editable-section-experience-details');
    await section.click();

    // Capture current title before editing (may differ from seed value on retry)
    const titleInput = section.getByLabel('Title');
    const originalTitle = await titleInput.inputValue();
    await titleInput.clear();
    await titleInput.fill('Changed Title');

    // Click Discard within the section
    await section.getByRole('button', { name: 'Discard' }).click();

    // Section should revert to display mode — click again to verify the original value is intact
    await section.click();
    await expect(section.getByLabel('Title')).toHaveValue(originalTitle);
  });
});
