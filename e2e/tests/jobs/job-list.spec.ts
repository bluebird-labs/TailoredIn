import { expect, test } from '@playwright/test';

test.describe('Job list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
  });

  test('loads with seeded job data in triage view', async ({ page }) => {
    // Default view is "triage" — the Triage button should be active (default variant)
    const triageButton = page.getByRole('button', { name: 'Triage' });
    await expect(triageButton).toBeVisible();

    // The heading shows the view label
    await expect(page.getByRole('heading', { name: 'Triage', level: 1 })).toBeVisible();

    // Table should have column headers
    await expect(page.getByRole('columnheader', { name: 'Company' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();

    // Seeded data includes NEW jobs — table should have at least one data row
    const rows = page.getByRole('row');
    // Header row + at least 1 data row
    await expect(rows).not.toHaveCount(1);

    // Verify a job title link is present in the table
    const firstJobLink = page.locator('table a[href^="/jobs/"]').first();
    await expect(firstJobLink).toBeVisible();
  });

  test('navigates to a job detail page from the list', async ({ page }) => {
    // Wait for data to load — find the first job link in the table
    const firstJobLink = page.locator('table a[href^="/jobs/"]').first();
    await expect(firstJobLink).toBeVisible();

    const jobTitle = await firstJobLink.textContent();
    await firstJobLink.click();

    // Should navigate to the job detail page
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]+$/);

    // Job detail page shows the job title as h1
    await expect(page.getByRole('heading', { name: jobTitle!, level: 1 })).toBeVisible();

    // "Back to jobs" link is present
    await expect(page.getByRole('link', { name: 'Back to jobs' })).toBeVisible();
  });

  test('switches between views', async ({ page }) => {
    // Start in triage view
    await expect(page.getByRole('heading', { name: 'Triage', level: 1 })).toBeVisible();

    // Switch to Archive — seed data has many retired jobs
    await page.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByRole('heading', { name: 'Archive', level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/[?&]view=archive/);

    // Archive should have data rows (423 retired + others in seed)
    const archiveJobLink = page.locator('table a[href^="/jobs/"]').first();
    await expect(archiveJobLink).toBeVisible();

    // Switch to Pipeline — seed has applied/offer/hm_screen jobs
    await page.getByRole('button', { name: 'Pipeline' }).click();
    await expect(page.getByRole('heading', { name: 'Pipeline', level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/[?&]view=pipeline/);

    const pipelineJobLink = page.locator('table a[href^="/jobs/"]').first();
    await expect(pipelineJobLink).toBeVisible();

    // Switch to All Jobs
    await page.getByRole('button', { name: 'All Jobs' }).click();
    await expect(page.getByRole('heading', { name: 'All Jobs', level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/[?&]view=all/);

    const allJobLink = page.locator('table a[href^="/jobs/"]').first();
    await expect(allJobLink).toBeVisible();
  });
});
