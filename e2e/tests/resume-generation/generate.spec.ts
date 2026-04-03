import { expect, test } from '@playwright/test';

test.describe('Resume generation from builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/builder');
    await expect(page.getByRole('heading', { name: 'Sylvain Estevez' })).toBeVisible();
  });

  test('generates a resume PDF with valid content', async ({ page }) => {
    const captured: { status: number; body: string }[] = [];
    await page.route('**/resume/profile/generate-pdf', async route => {
      const response = await route.fetch();
      captured.push({
        status: response.status(),
        body: await response.text()
      });
      await route.fulfill({ response });
    });

    await page.getByRole('button', { name: 'Generate PDF' }).click();
    await expect(page.getByText('PDF generated successfully')).toBeVisible({ timeout: 60_000 });

    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe(200);
    // Response is JSON with pdfPath
    const parsed = JSON.parse(captured[0].body) as { data: { pdfPath: string } };
    expect(parsed.data.pdfPath).toBeTruthy();
    expect(parsed.data.pdfPath).toMatch(/\.pdf$/);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('live preview compiles PDF from seeded content', async ({ page }) => {
    const previewCalls: { status: number; bodyLength: number }[] = [];
    await page.route('**/resumes/preview', async route => {
      const response = await route.fetch();
      const body = await response.body();
      previewCalls.push({ status: response.status(), bodyLength: body.length });
      await route.fulfill({ response });
    });

    // The preview should auto-compile within a few seconds of loading
    await expect(async () => {
      expect(previewCalls.length).toBeGreaterThan(0);
    }).toPass({ timeout: 15_000 });

    // Preview should return a valid PDF
    const last = previewCalls[previewCalls.length - 1];
    expect(last.status).toBe(200);
    expect(last.bodyLength).toBeGreaterThan(100);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
