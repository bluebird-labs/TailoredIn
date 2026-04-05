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
    await expect(
      page.locator('[data-testid^="editable-section-headline-"]').filter({ hasText: 'Principal Engineer' })
    ).toBeVisible();
  });

  test('edit a headline', async ({ page }) => {
    // Wait for content-first cards (button = display mode), then click to enter edit mode
    const displayCard = page
      .locator('button[data-testid^="editable-section-headline-"]')
      .filter({ hasText: 'Full-Stack Developer' });
    await expect(displayCard).toBeVisible();

    // Grab the testid before clicking (the edit div has the same testid)
    const testId = await displayCard.getAttribute('data-testid');
    await displayCard.click();

    // Now in edit mode — section is a div with the same testid
    const editSection = page.locator(`div[data-testid="${testId}"]`);
    await editSection.getByLabel('Label').clear();
    await editSection.getByLabel('Label').fill('Distinguished Engineer');

    await editSection.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
    await expect(page.getByText('Distinguished Engineer')).toBeVisible();
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

    // Find the display card (button) and click to enter edit mode
    const displayCard = page
      .locator('button[data-testid^="editable-section-headline-"]')
      .filter({ hasText: 'Temp Headline' });
    const testId = await displayCard.getAttribute('data-testid');
    await displayCard.click();

    // Click the delete button in the edit section (div with same testid)
    const editSection = page.locator(`div[data-testid="${testId}"]`);
    await editSection.locator('button.text-destructive').click();

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
