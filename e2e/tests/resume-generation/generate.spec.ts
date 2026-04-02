import { expect, test } from '@playwright/test';

test.describe('Resume generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
    const firstJobLink = page.locator('table a[href^="/jobs/"]').first();
    await expect(firstJobLink).toBeVisible();
    await firstJobLink.click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+$/);
  });

  test('generates a resume PDF for an archetype', async ({ page }) => {
    // Intercept the response to capture the PDF body
    const captured: { status: number; contentType: string; body: Buffer }[] = [];
    await page.route('**/generate-resume', async route => {
      const response = await route.fetch();
      captured.push({
        status: response.status(),
        contentType: response.headers()['content-type'] ?? '',
        body: await response.body()
      });
      await route.fulfill({ response });
    });

    // Select "Lead IC" archetype (LLM is unavailable in E2E, so manual form is shown)
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'Lead IC' }).click();

    await page.getByRole('button', { name: 'Generate Resume' }).click();
    await expect(page.getByText('Resume downloaded')).toBeVisible({ timeout: 60_000 });

    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe(200);
    expect(captured[0].contentType).toContain('application/pdf');
    expect(captured[0].body.length).toBeGreaterThan(100);
    expect(captured[0].body.subarray(0, 5).toString()).toBe('%PDF-');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('different archetypes produce different PDFs', async ({ page }) => {
    // Set up route interception for all generate calls in this test
    const captured: Buffer[] = [];
    await page.route('**/generate-resume', async route => {
      const response = await route.fetch();
      captured.push(await response.body());
      await route.fulfill({ response });
    });

    // Generate with "Lead IC"
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'Lead IC' }).click();
    await page.getByRole('button', { name: 'Generate Resume' }).click();
    await expect(page.getByText('Resume downloaded')).toBeVisible({ timeout: 60_000 });

    // Generate with "Nerd"
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'Nerd' }).click();
    await page.getByRole('button', { name: 'Generate Resume' }).click();
    // Wait for second toast — need to wait for the button to finish loading first
    await expect(page.getByRole('button', { name: 'Generate Resume' })).toBeEnabled({ timeout: 60_000 });

    expect(captured).toHaveLength(2);
    expect(captured[0].length).toBeGreaterThan(100);
    expect(captured[1].length).toBeGreaterThan(100);
    expect(captured[0].length).not.toBe(captured[1].length);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('content selection drives PDF output', async ({ page }) => {
    const captured: { status: number; contentType: string; body: Buffer }[] = [];
    await page.route('**/generate-resume', async route => {
      const response = await route.fetch();
      captured.push({
        status: response.status(),
        contentType: response.headers()['content-type'] ?? '',
        body: await response.body()
      });
      await route.fulfill({ response });
    });

    // Generate with "IC" archetype (different content selection than Lead IC)
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'IC', exact: true }).click();

    // Add keywords to influence content
    await page.getByLabel('Keywords (optional)').fill('typescript, node.js, microservices');

    await page.getByRole('button', { name: 'Generate Resume' }).click();
    await expect(page.getByText('Resume downloaded')).toBeVisible({ timeout: 60_000 });

    expect(captured).toHaveLength(1);
    expect(captured[0].status).toBe(200);
    expect(captured[0].contentType).toContain('application/pdf');
    expect(captured[0].body.length).toBeGreaterThan(100);
    expect(captured[0].body.subarray(0, 5).toString()).toBe('%PDF-');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
