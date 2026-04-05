import { expect, test } from '@playwright/test';

test.describe('Accomplishments', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/experiences');
  });

  /** Click Acme Corp card text to open the edit modal */
  async function openAcmeCorpModal(page: import('@playwright/test').Page) {
    await page.getByText('Acme Corp').click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }

  /** Get accomplishment editors within the dialog (excludes add form) */
  function getEditors(dialog: import('@playwright/test').Locator) {
    // Accomplishment editors have border + rounded-lg + editable-field, but NOT border-dashed (which is the add form)
    return dialog
      .locator('div.border.rounded-lg:not(.border-dashed)')
      .filter({ has: dialog.page().locator('[data-slot="editable-field"]') });
  }

  test('displays accomplishments in experience edit modal', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Accomplishments')).toBeVisible();

    const editors = getEditors(dialog);
    await expect(editors.nth(0).getByLabel('Title')).toHaveValue('Migrated to Kubernetes');
    await expect(editors.nth(1).getByLabel('Title')).toHaveValue('Reduced API latency by 40%');
  });

  test('add a new accomplishment', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Add accomplishment' }).click();

    // Scope to the add form (border-dashed container)
    const addForm = dialog.locator('div.border-dashed').filter({ hasText: 'New accomplishment' });
    await expect(addForm).toBeVisible();

    await addForm.getByPlaceholder('Accomplishment title').fill('Built observability platform');
    await addForm
      .getByPlaceholder('Describe what you did')
      .fill('Designed and deployed a comprehensive observability stack.');

    await addForm.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByText('Accomplishment added')).toBeVisible();
  });

  test('cancel adding accomplishment hides the form', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Add accomplishment' }).click();

    const addForm = dialog.locator('div.border-dashed').filter({ hasText: 'New accomplishment' });
    await addForm.getByPlaceholder('Accomplishment title').fill('Temp');

    await addForm.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog.getByText('New accomplishment')).not.toBeVisible();
  });

  test('edit an accomplishment title and save', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    const editors = getEditors(dialog);
    const firstEditor = editors.first();

    const titleInput = firstEditor.getByLabel('Title');
    const originalValue = await titleInput.inputValue();
    await titleInput.clear();
    await titleInput.fill('Migrated to K8s');

    // SaveBar should appear in the accomplishment editor
    await expect(firstEditor.locator('[data-slot="save-bar"]')).toBeVisible();
    await firstEditor.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
    // Verify the original value placeholder confirms we changed it
    await expect(titleInput).not.toHaveValue(originalValue);
  });

  test('discard accomplishment changes reverts field', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    const editors = getEditors(dialog);
    const firstEditor = editors.first();

    const titleInput = firstEditor.getByLabel('Title');
    const originalValue = await titleInput.inputValue();
    await titleInput.clear();
    await titleInput.fill('Something Else');

    await firstEditor.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Discard' }).click();

    await expect(titleInput).toHaveValue(originalValue);
  });

  test('delete accomplishment shows confirmation dialog', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    const editors = getEditors(dialog);
    const lastEditor = editors.last();

    // Click delete on an accomplishment
    await lastEditor.locator('button.text-destructive').click();

    // Verify AlertDialog appears with correct content
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete accomplishment?')).toBeVisible();
    await expect(alertDialog.getByText('permanently removed')).toBeVisible();
    await expect(alertDialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(alertDialog.getByRole('button', { name: 'Delete' })).toBeVisible();

    // Cancel to dismiss (delete confirmation is verified in headlines/education tests)
    await alertDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(alertDialog).not.toBeVisible();
  });

  test('reorder buttons are present and correctly enabled/disabled', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    const editors = getEditors(dialog);
    const count = await editors.count();
    await expect(count).toBeGreaterThanOrEqual(2);

    // First editor: move up disabled, move down enabled
    await expect(editors.first().getByRole('button', { name: 'Move up' })).toBeDisabled();
    await expect(editors.first().getByRole('button', { name: 'Move down' })).toBeEnabled();

    // Last editor: move up enabled, move down disabled
    await expect(editors.last().getByRole('button', { name: 'Move up' })).toBeEnabled();
    await expect(editors.last().getByRole('button', { name: 'Move down' })).toBeDisabled();
  });

  test('validation: empty title shows error when adding', async ({ page }) => {
    await openAcmeCorpModal(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Add accomplishment' }).click();

    const addForm = dialog.locator('div.border-dashed').filter({ hasText: 'New accomplishment' });
    await addForm.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(addForm.getByText('Title is required')).toBeVisible();
  });
});
