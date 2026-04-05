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
    // Wait for the create form to collapse and new card to appear as content
    await expect(page.locator('[data-testid^="editable-section-headline-"]').filter({ hasText: 'Principal Engineer' })).toBeVisible();
  });

  test('edit a headline', async ({ page }) => {
    // Find the "Full-Stack Developer" card by its content text and click to enter edit mode
    const card = page.locator('[data-testid^="editable-section-headline-"]').filter({ hasText: 'Full-Stack Developer' });
    await card.click();

    // Now form fields are available — edit the label
    await card.getByLabel('Label').clear();
    await card.getByLabel('Label').fill('Distinguished Engineer');

    // SaveBar should appear within the card
    await card.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
    // After save, section returns to display mode — check content text
    await expect(card.getByText('Distinguished Engineer')).toBeVisible();
  });

  test('delete a headline', async ({ page }) => {
    // First, create one so we can safely delete it
    await page.getByRole('button', { name: 'Add headline' }).click();
    const createForm = page.locator('div.border-primary\\/30');
    await createForm.getByLabel('Label').fill('Temp Headline');
    await createForm.getByLabel('Summary').fill('To be deleted.');
    await createForm.getByRole('button', { name: 'Save' }).click();
    // After create, new card appears as content text (not an input)
    await expect(page.getByText('Temp Headline')).toBeVisible();

    // Find the card by content text and click to enter edit mode (delete button only visible in edit mode)
    const card = page.locator('[data-testid^="editable-section-headline-"]').filter({ hasText: 'Temp Headline' });
    await card.click();

    // Click the delete button (icon-only button with destructive styling)
    await card.locator('button.text-destructive').click();

    // Confirm in AlertDialog
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog.getByText('Delete headline?')).toBeVisible();
    await alertDialog.getByRole('button', { name: 'Delete' }).click();

    // Headline text is gone from the page
    await expect(page.getByText('Temp Headline')).not.toBeVisible();
  });

  test('validation: empty label shows error', async ({ page }) => {
    await page.getByRole('button', { name: 'Add headline' }).click();
    const createForm = page.locator('div.border-primary\\/30');
    await createForm.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Label is required')).toBeVisible();
  });
});
