import { expect, test } from '@playwright/test';

test.describe('Resume Builder', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/builder');
    // Wait for the page to render with seeded profile data
    await expect(page.getByRole('heading', { name: 'Sylvain Estevez' })).toBeVisible();
  });

  /* 1 — Page renders with seeded data */
  test('renders resume preview with seeded data', async ({ page }) => {
    // Name
    await expect(page.getByText('Sylvain Estevez')).toBeVisible();

    // Contact icons (LinkedIn, email, etc.)
    await expect(page.getByText('estevez.sylvain@gmail.com')).toBeVisible();

    // Experience section title
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

    // Education section
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
  });

  /* 2 — Education visibility toggle */
  test('toggles education visibility', async ({ page }) => {
    // Find first education entry and hover to reveal eye icon
    const eduEntry = page.locator('.group\\/edu').first();
    await eduEntry.hover();

    const toggleBtn = eduEntry.getByTitle('Hide from resume');
    await toggleBtn.click();

    // The text should get strikethrough
    const innerBtn = eduEntry.locator('button').first();
    await expect(innerBtn).toHaveClass(/line-through/);

    // Re-hover and toggle back
    await page.mouse.move(0, 0);
    await eduEntry.hover();
    await eduEntry.getByTitle('Show on resume').click();

    await expect(innerBtn).not.toHaveClass(/line-through/);
  });

  /* 3 — Generate PDF */
  test('generates a resume PDF', async ({ page }) => {
    const captured: { status: number }[] = [];
    await page.route('**/resume/profile/generate-pdf', async route => {
      const response = await route.fetch();
      captured.push({ status: response.status() });
      await route.fulfill({ response });
    });

    await page.getByRole('button', { name: 'Generate PDF' }).click();
    await expect(page.getByText('PDF generated successfully')).toBeVisible({ timeout: 60_000 });

    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe(200);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
