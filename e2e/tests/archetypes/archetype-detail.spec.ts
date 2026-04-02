import { expect, test } from '@playwright/test';

test.describe('Archetype detail smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate from list to first archetype detail via Eye link
    await page.goto('/archetypes/');
    await expect(page.getByRole('heading', { name: 'Archetypes', level: 1 })).toBeVisible();

    const firstViewLink = page.locator('table a[href^="/archetypes/"]').first();
    await firstViewLink.click();
    await expect(page.getByRole('link', { name: 'Back to archetypes' })).toBeVisible();
  });

  test('loads metadata section with key and label', async ({ page }) => {
    // CardTitle renders as <div>, not heading
    await expect(page.getByText('Metadata', { exact: true })).toBeVisible();
    // Label htmlFor="archetype-key" / "archetype-label"
    await expect(page.locator('#archetype-key')).not.toHaveValue('');
    await expect(page.locator('#archetype-label')).not.toHaveValue('');
    await expect(page.getByRole('button', { name: 'Save metadata' })).toBeVisible();
  });

  test('headline picker has options', async ({ page }) => {
    // The Headline label and select should be present
    await expect(page.getByText('Headline', { exact: true })).toBeVisible();
  });

  test('tag profile section has weight inputs', async ({ page }) => {
    // CardTitle renders as <div>
    await expect(page.getByText('Tag Profile', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Role Tag Weights' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Skill Tag Weights' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Save tag profile' })).toBeVisible();
  });

  test('content selection section has checkboxes', async ({ page }) => {
    // CardTitle renders as <div>
    await expect(page.getByText('Content Selection', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Experiences' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();

    // At least one checkbox should be present (for seeded experiences/education/skills)
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save content selection' })).toBeVisible();
  });
});
