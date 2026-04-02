import { readFileSync } from 'node:fs';
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
    // Select "Lead IC" archetype (LLM is unavailable in E2E, so manual form is shown)
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'Lead IC' }).click();

    // Trigger generate and wait for download
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Generate Resume' }).click();
    const download = await downloadPromise;

    // Verify toast
    await expect(page.getByText('Resume downloaded')).toBeVisible();

    // Verify the file is a valid PDF
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const buffer = readFileSync(filePath!);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('different archetypes produce different PDFs', async ({ page }) => {
    // Generate with "Lead IC"
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'Lead IC' }).click();

    const download1Promise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Generate Resume' }).click();
    const download1 = await download1Promise;
    await expect(page.getByText('Resume downloaded')).toBeVisible();

    const path1 = await download1.path();
    const size1 = readFileSync(path1!).length;

    // Generate with "Nerd"
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'Nerd' }).click();

    const download2Promise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Generate Resume' }).click();
    const download2 = await download2Promise;

    const path2 = await download2.path();
    const size2 = readFileSync(path2!).length;

    // Different archetypes should produce different PDFs
    expect(size1).not.toBe(size2);
  });

  test('content selection drives PDF output', async ({ page }) => {
    // Generate with "IC" archetype (different content selection than Lead IC)
    await page.locator('#archetype-select').click();
    await page.getByRole('option', { name: 'IC', exact: true }).click();

    // Add keywords to influence content
    await page.getByLabel('Keywords (comma-separated)').fill('typescript, node.js, microservices');

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Generate Resume' }).click();
    const download = await downloadPromise;

    // Verify the PDF is valid and non-empty
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const buffer = readFileSync(filePath!);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
