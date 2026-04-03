import { expect, test } from '@playwright/test';

test.describe('Resume generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume?tab=wardrobe');
    await expect(page.getByRole('tab', { name: 'Experience' })).toBeVisible();
  });

  test('generates a resume PDF via profile endpoint', async ({ page }) => {
    // Trigger PDF generation via the API directly
    const response = await page.request.post('/api/resume/profile/generate-pdf');
    expect(response.status()).toBe(200);
    const parsed = (await response.json()) as { data: { pdfPath: string } };
    expect(parsed.data.pdfPath).toBeTruthy();
    expect(parsed.data.pdfPath).toMatch(/\.pdf$/);
  });

  test('factory tab shows job description input', async ({ page }) => {
    await page.goto('/resume?tab=factory');
    // Factory input step should render a textarea for job description
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 10_000 });
  });
});
