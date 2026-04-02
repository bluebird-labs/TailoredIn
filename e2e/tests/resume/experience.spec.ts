import { expect, type Page, test } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Helper: seed a bullet variant via API (needed for tests 7-11)     */
/* ------------------------------------------------------------------ */

async function seedVariantViaApi(
  page: Page,
  options: { approvalStatus?: string } = {}
): Promise<{ experienceId: string; bulletId: string }> {
  // Fetch all experiences and find the Stealth Startup one
  const expRes = await page.request.get('/api/experiences');
  const expBody = await expRes.json();
  const stealthExp = expBody.data.find((e: { companyName: string }) => e.companyName === 'Stealth Startup');
  if (!stealthExp) throw new Error('Stealth Startup experience not found in seed data');

  const bulletId = stealthExp.bullets[0].id as string;
  const experienceId = stealthExp.id as string;

  // Create a variant on the first bullet
  const varRes = await page.request.post(`/api/bullets/${bulletId}/variants`, {
    data: {
      experience_id: experienceId,
      text: 'E2E test variant',
      angle: 'testing',
      source: 'manual',
      approval_status: options.approvalStatus ?? 'APPROVED',
      role_tags: [],
      skill_tags: []
    }
  });
  expect(varRes.ok()).toBeTruthy();

  // Reload the page so the UI picks up the new variant
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Work Experience' })).toBeVisible();

  return { experienceId, bulletId };
}

/* ------------------------------------------------------------------ */
/*  Helper: pick month/year in a MonthYearPicker (shadcn Select)      */
/* ------------------------------------------------------------------ */

async function pickMonthYear(page: Page, container: ReturnType<Page['locator']>, month: string, year: string) {
  // Month select — first trigger inside the flex gap-2 wrapper
  const monthTrigger = container.getByRole('combobox').first();
  await monthTrigger.click();
  await page.getByRole('option', { name: month }).click();

  // Year select — second trigger
  const yearTrigger = container.getByRole('combobox').nth(1);
  await yearTrigger.click();
  await page.getByRole('option', { name: year }).click();
}

/* ------------------------------------------------------------------ */
/*  Helper: scope to an experience row by company name                */
/* ------------------------------------------------------------------ */

function experienceRow(page: Page, companyName: string) {
  return page.locator('div.flex.border-b').filter({ hasText: companyName });
}

/* ------------------------------------------------------------------ */
/*  Test suite                                                        */
/* ------------------------------------------------------------------ */

test.describe('Experience Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/experience');
    await expect(page.getByRole('heading', { name: 'Work Experience' })).toBeVisible();
  });

  /* 1 — Resume layout renders */
  test('resume layout renders with seeded data', async ({ page }) => {
    // Heading + subtitle
    await expect(page.getByRole('heading', { name: 'Work Experience' })).toBeVisible();
    await expect(page.getByText('Your career history — click any bullet to edit inline')).toBeVisible();

    // Add Experience button
    await expect(page.getByRole('button', { name: '+ Add Experience' })).toBeVisible();

    // Seeded experience titles and companies
    await expect(page.getByText('Staff Software Engineer').first()).toBeVisible();
    await expect(page.getByText('Stealth Startup')).toBeVisible();

    // At least one bullet is visible (seeded data has bullet text)
    const stealthRow = experienceRow(page, 'Stealth Startup');
    await expect(stealthRow.locator('li').first()).toBeVisible();

    // Gutter stats for Stealth Startup (4 bullets)
    await expect(stealthRow.getByText('4 bullets')).toBeVisible();
  });

  /* 2 — Create experience */
  test('creates a new experience', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Experience' }).click();
    await expect(page.getByRole('heading', { name: 'Add Experience' })).toBeVisible();

    // Fill form fields
    await page.getByLabel('Title').fill('QA Engineer');
    await page.getByLabel('Company').fill('E2E Corp');
    await page.getByLabel(/Website/).fill('https://e2ecorp.dev');
    await page.getByLabel('Location').fill('Remote');

    // Start Date picker — find the container by label "Start Date"
    const startDateSection = page.locator('div.space-y-2').filter({ hasText: 'Start Date' });
    await pickMonthYear(page, startDateSection, 'Mar', '2025');

    // End Date picker
    const endDateSection = page.locator('div.space-y-2').filter({ hasText: 'End Date' });
    await pickMonthYear(page, endDateSection, 'Jun', '2025');

    await page.getByLabel(/Summary/).fill('Responsible for end-to-end testing.');
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify toast and new entry
    await expect(page.getByText('Experience created')).toBeVisible();
    await expect(page.getByText('QA Engineer')).toBeVisible();
    await expect(page.getByText('E2E Corp')).toBeVisible();
  });

  /* 3 — Edit experience */
  test('edits an existing experience', async ({ page }) => {
    // First, create a temp experience to edit
    await page.getByRole('button', { name: '+ Add Experience' }).click();
    await page.getByLabel('Title').fill('Temp Role');
    await page.getByLabel('Company').fill('Temp Inc');
    await page.getByLabel('Location').fill('NYC');

    const startDateSection = page.locator('div.space-y-2').filter({ hasText: 'Start Date' });
    await pickMonthYear(page, startDateSection, 'Jan', '2024');
    const endDateSection = page.locator('div.space-y-2').filter({ hasText: 'End Date' });
    await pickMonthYear(page, endDateSection, 'Feb', '2024');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Experience created')).toBeVisible();

    // Now edit it
    const row = experienceRow(page, 'Temp Inc');
    await row.getByRole('button', { name: '✏️ Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Experience' })).toBeVisible();

    await page.getByLabel('Title').clear();
    await page.getByLabel('Title').fill('Updated Role');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Experience updated')).toBeVisible();
    await expect(page.getByText('Updated Role')).toBeVisible();
  });

  /* 4 — Delete experience */
  test('deletes an experience', async ({ page }) => {
    // Create a temp experience to delete
    await page.getByRole('button', { name: '+ Add Experience' }).click();
    await page.getByLabel('Title').fill('Disposable Role');
    await page.getByLabel('Company').fill('Disposable Co');
    await page.getByLabel('Location').fill('Nowhere');

    const startDateSection = page.locator('div.space-y-2').filter({ hasText: 'Start Date' });
    await pickMonthYear(page, startDateSection, 'May', '2023');
    const endDateSection = page.locator('div.space-y-2').filter({ hasText: 'End Date' });
    await pickMonthYear(page, endDateSection, 'Jun', '2023');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Experience created')).toBeVisible();

    // Delete it
    const row = experienceRow(page, 'Disposable Co');
    await row.getByRole('button', { name: '🗑 Delete' }).click();

    await expect(page.getByText('Delete Experience')).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete "Disposable Role" at Disposable Co?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Experience deleted')).toBeVisible();
    await expect(page.getByText('Disposable Co')).not.toBeVisible();
  });

  /* 5 — Inline bullet edit */
  test('edits a bullet inline', async ({ page }) => {
    const row = experienceRow(page, 'Stealth Startup');

    // Find first bullet and click edit pill
    const firstBullet = row.locator('li').first();
    await firstBullet.getByRole('button', { name: 'edit' }).click();

    // Input should appear — clear and type new text
    const input = firstBullet.getByRole('textbox');
    await input.clear();
    await input.fill('Updated bullet text via E2E');
    await firstBullet.getByRole('button', { name: 'save' }).click();

    await expect(page.getByText('Bullet updated')).toBeVisible();
    await expect(page.getByText('Updated bullet text via E2E')).toBeVisible();
  });

  /* 6 — Add bullet */
  test('adds a bullet to an experience', async ({ page }) => {
    const row = experienceRow(page, 'Stealth Startup');

    // Click "+ Add" in the gutter
    await row.getByRole('button', { name: '+ Add' }).click();

    // Input with placeholder appears
    const bulletInput = row.getByPlaceholder('Bullet point content...');
    await expect(bulletInput).toBeVisible();
    await bulletInput.fill('New bullet added via E2E test');

    // Click the "Add" button (in the inline form, not the gutter)
    await row.locator('div.flex.items-center.gap-2').getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Bullet added')).toBeVisible();
    await expect(page.getByText('New bullet added via E2E test')).toBeVisible();
  });

  /* 7 — Toggle variants */
  test('toggles variant list visibility', async ({ page }) => {
    await seedVariantViaApi(page);

    const row = experienceRow(page, 'Stealth Startup');
    const firstBullet = row.locator('li').first();

    // The variant toggle pill should show count
    const togglePill = firstBullet.getByRole('button', { name: /⟳ 1/ });
    await expect(togglePill).toBeVisible();

    // Click to expand
    await togglePill.click();

    // Variant list with left border should appear
    const variantList = row.locator('div.border-l-2');
    await expect(variantList).toBeVisible();
    await expect(page.getByText('E2E test variant')).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Add variant' })).toBeVisible();

    // Click pill again to collapse
    await firstBullet.getByRole('button', { name: /⟳ 1/ }).click();
    await expect(variantList).not.toBeVisible();
  });

  /* 8 — Approve variant */
  test('approves a pending variant', async ({ page }) => {
    await seedVariantViaApi(page, { approvalStatus: 'PENDING' });

    const row = experienceRow(page, 'Stealth Startup');
    const firstBullet = row.locator('li').first();

    // Expand variants
    await firstBullet.getByRole('button', { name: /⟳ 1/ }).click();

    // Assert PENDING badge visible
    const variantCard = row.locator('div.rounded-\\[6px\\]').filter({ hasText: 'E2E test variant' });
    await expect(variantCard.getByText('PENDING')).toBeVisible();

    // Click approve
    await variantCard.getByRole('button', { name: '✓' }).click();

    await expect(page.getByText('Variant approved')).toBeVisible();
    await expect(variantCard.getByText('APPROVED')).toBeVisible();

    // Approve/reject pills should be gone
    await expect(variantCard.getByRole('button', { name: '✓' })).not.toBeVisible();
    await expect(variantCard.getByRole('button', { name: '✗' })).not.toBeVisible();
  });

  /* 9 — Reject variant */
  test('rejects a pending variant', async ({ page }) => {
    await seedVariantViaApi(page, { approvalStatus: 'PENDING' });

    const row = experienceRow(page, 'Stealth Startup');
    const firstBullet = row.locator('li').first();

    // Expand variants
    await firstBullet.getByRole('button', { name: /⟳ 1/ }).click();

    const variantCard = row.locator('div.rounded-\\[6px\\]').filter({ hasText: 'E2E test variant' });

    // Click reject
    await variantCard.getByRole('button', { name: '✗' }).click();

    await expect(page.getByText('Variant rejected')).toBeVisible();
    await expect(variantCard.getByText('REJECTED')).toBeVisible();
  });

  /* 10 — Add variant */
  test('adds a variant via the variant list', async ({ page }) => {
    await seedVariantViaApi(page);

    const row = experienceRow(page, 'Stealth Startup');
    const firstBullet = row.locator('li').first();

    // Expand variants
    await firstBullet.getByRole('button', { name: /⟳ 1/ }).click();
    await expect(page.getByText('E2E test variant')).toBeVisible();

    // Click "+ Add variant"
    await page.getByRole('button', { name: '+ Add variant' }).click();

    // Fill variant form
    await page.getByPlaceholder('Variant text...').fill('Second E2E variant');
    await page.getByPlaceholder('Angle (e.g. leadership)').fill('scalability');

    // Click Add button in the variant add form
    const variantList = row.locator('div.border-l-2');
    await variantList.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Variant added')).toBeVisible();
    await expect(page.getByText('Second E2E variant')).toBeVisible();

    // Pill count should update to 2
    await expect(firstBullet.getByRole('button', { name: /⟳ 2/ })).toBeVisible();
  });

  /* 11 — Delete variant */
  test('deletes a variant', async ({ page }) => {
    await seedVariantViaApi(page);

    const row = experienceRow(page, 'Stealth Startup');
    const firstBullet = row.locator('li').first();

    // Expand variants
    await firstBullet.getByRole('button', { name: /⟳ 1/ }).click();

    const variantCard = row.locator('div.rounded-\\[6px\\]').filter({ hasText: 'E2E test variant' });

    // Click del pill
    await variantCard.getByRole('button', { name: 'del' }).click();

    await expect(page.getByText('Variant deleted')).toBeVisible();
    await expect(page.getByText('E2E test variant')).not.toBeVisible();

    // Toggle pill should be gone (no more variants)
    await expect(firstBullet.getByRole('button', { name: /⟳/ })).not.toBeVisible();
  });
});
