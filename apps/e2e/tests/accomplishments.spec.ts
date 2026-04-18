import { expect, test } from '@playwright/test';

test.describe('Accomplishments', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('tab', { name: 'Experiences' }).click();
  });

  /** Navigate to Acme Corp detail page → Accomplishments tab */
  async function goToAccomplishmentsTab(page: import('@playwright/test').Page) {
    await page.getByText('Acme Corp').click();
    await page.waitForURL(/\/experiences\/.+/);
    await page.getByRole('tab', { name: /Accomplishments/ }).click();
  }

  test('displays accomplishments on tab', async ({ page }) => {
    await goToAccomplishmentsTab(page);

    // Verify at least 2 accomplishment cards are visible with non-empty titles
    const cards = page.locator('[data-testid^="editable-section-accomplishment-"]');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText(/#\d+/);
    await expect(cards.nth(1)).toContainText(/#\d+/);
  });

  test('add a new accomplishment', async ({ page }) => {
    await goToAccomplishmentsTab(page);

    await page.getByRole('button', { name: 'Add accomplishment' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Add Accomplishment')).toBeVisible();

    await dialog.getByLabel('Title').fill('Built observability platform');
    await dialog.getByLabel('Narrative').fill('Designed and deployed a comprehensive observability stack.');

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Accomplishment added')).toBeVisible();
    await expect(page.getByText('Built observability platform')).toBeVisible();
  });

  test('cancel adding accomplishment closes modal', async ({ page }) => {
    await goToAccomplishmentsTab(page);

    await page.getByRole('button', { name: 'Add accomplishment' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title').fill('Temp');

    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Dirty form triggers discard confirmation
    const alertDialog = page.getByRole('alertdialog');
    await alertDialog.getByRole('button', { name: 'Discard' }).click();

    await expect(dialog).not.toBeVisible();
  });

  test('edit an accomplishment title and save', async ({ page }) => {
    await goToAccomplishmentsTab(page);

    // Click the first accomplishment card to enter edit mode
    const cards = page.locator('[data-testid^="editable-section-accomplishment-"]');
    const firstCard = cards.first();
    await firstCard.click();

    const titleInput = firstCard.getByLabel('Title');
    await titleInput.clear();
    await titleInput.fill('Migrated to K8s');

    // Save within the section
    await firstCard.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
  });

  test('discard accomplishment changes reverts field', async ({ page }) => {
    await goToAccomplishmentsTab(page);

    // Click the first accomplishment card to enter edit mode
    const cards = page.locator('[data-testid^="editable-section-accomplishment-"]');
    const firstCard = cards.first();
    await firstCard.click();

    const titleInput = firstCard.getByLabel('Title');
    const originalValue = await titleInput.inputValue();
    await titleInput.clear();
    await titleInput.fill('Something Else');

    // Discard within the section
    await firstCard.getByRole('button', { name: 'Discard' }).click();

    // Section reverts to display mode — click again to verify original value
    await firstCard.click();
    await expect(firstCard.getByLabel('Title')).toHaveValue(originalValue);
  });

  test('delete accomplishment shows confirmation dialog', async ({ page }) => {
    await goToAccomplishmentsTab(page);

    // Click the last accomplishment card to enter edit mode (so delete button is visible)
    const cards = page.locator('[data-testid^="editable-section-accomplishment-"]');
    const lastCard = cards.last();
    await lastCard.click();

    // Click the delete (trash) button within the editor
    await lastCard.locator('button.text-destructive').click();

    // Verify AlertDialog appears with correct content
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete accomplishment?')).toBeVisible();
    await expect(alertDialog.getByText('permanently removed')).toBeVisible();
    await expect(alertDialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(alertDialog.getByRole('button', { name: 'Delete' })).toBeVisible();

    // Cancel to dismiss
    await alertDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(alertDialog).not.toBeVisible();
  });

  test('validation: empty title shows error when adding', async ({ page }) => {
    await goToAccomplishmentsTab(page);

    await page.getByRole('button', { name: 'Add accomplishment' }).click();

    const dialog = page.getByRole('dialog');
    // Fill narrative to enable Save (dirtyCount > 0 required)
    await dialog.getByLabel('Narrative').fill('Some description');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog.getByText('Title is required')).toBeVisible();
  });
});
