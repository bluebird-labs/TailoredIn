import { expect, test } from '@playwright/test';

test.describe('Resume generation from builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/builder');
    await expect(page.getByRole('heading', { name: 'Sylvain Estevez' })).toBeVisible();
  });

  test('generates a resume PDF with valid content', async ({ page }) => {
    const captured: { status: number; contentType: string; body: Buffer }[] = [];
    await page.route('**/resumes/generate', async route => {
      const response = await route.fetch();
      captured.push({
        status: response.status(),
        contentType: response.headers()['content-type'] ?? '',
        body: await response.body()
      });
      await route.fulfill({ response });
    });

    await page.getByRole('button', { name: 'Generate PDF' }).click();
    await expect(page.getByText('Resume downloaded')).toBeVisible({ timeout: 60_000 });

    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe(200);
    expect(captured[0].contentType).toContain('application/pdf');
    expect(captured[0].body.length).toBeGreaterThan(100);
    expect(captured[0].body.subarray(0, 5).toString()).toBe('%PDF-');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('hiding bullets produces a different PDF', async ({ page }) => {
    const captured: Buffer[] = [];
    await page.route('**/resumes/generate', async route => {
      const response = await route.fetch();
      captured.push(await response.body());
      await route.fulfill({ response });
    });

    // Generate with default selection
    await page.getByRole('button', { name: 'Generate PDF' }).click();
    await expect(page.getByText('Resume downloaded')).toBeVisible({ timeout: 60_000 });

    // Open the first experience modal and hide a bullet
    const companyBlock = page.locator('.group\\/company').first();
    await companyBlock.hover();
    await companyBlock.getByTitle('Edit experience').click();

    const dialogContent = page.locator('[data-slot="dialog-content"]');
    await expect(dialogContent).toBeVisible();

    // Toggle first visible bullet off
    const excludeBtn = dialogContent.getByTitle('Exclude from resume').first();
    if ((await excludeBtn.count()) > 0) {
      await excludeBtn.click();
    }

    await page.getByRole('button', { name: 'Done' }).click();

    // Generate again
    await page.getByRole('button', { name: 'Generate PDF' }).click();
    // Wait for button to re-enable after second generation
    await expect(page.getByRole('button', { name: 'Generate PDF' })).toBeEnabled({ timeout: 60_000 });

    // Two PDFs should have been captured and they should differ
    expect(captured).toHaveLength(2);
    expect(captured[0].length).toBeGreaterThan(100);
    expect(captured[1].length).toBeGreaterThan(100);
    expect(captured[0].length).not.toBe(captured[1].length);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
