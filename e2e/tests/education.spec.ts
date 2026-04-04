import { expect, test } from '@playwright/test';

test.describe('Education Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/education');
  });

  test('displays page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Education' })).toBeVisible();
  });

  test('lists all seeded educations', async ({ page }) => {
    await expect(page.getByText('Stanford University')).toBeVisible();
    await expect(page.getByText('B.S. Computer Science')).toBeVisible();
    await expect(page.getByText('2020')).toBeVisible();
    await expect(page.getByText('Magna Cum Laude')).toBeVisible();

    await expect(page.getByText('Carnegie Mellon University')).toBeVisible();
    await expect(page.getByText('M.S. Software Engineering')).toBeVisible();
    await expect(page.getByText('2022')).toBeVisible();
  });

  test('create a new education', async ({ page }) => {
    await page.getByRole('button', { name: 'Add education' }).click();

    await page.getByPlaceholder('Institution name').fill('MIT');
    await page.getByPlaceholder('Degree title').fill('Ph.D. Artificial Intelligence');
    await page.getByPlaceholder('Graduation year').fill('2025');
    await page.getByPlaceholder('Location (optional)').fill('Cambridge, MA');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('MIT')).toBeVisible();
    await expect(page.getByText('Ph.D. Artificial Intelligence')).toBeVisible();
  });

  test('edit an education', async ({ page }) => {
    const card = page.locator('div.border.rounded-lg').filter({ hasText: 'Stanford University' }).first();
    await card.hover();

    // Click edit button
    await card.locator('button').filter({ has: page.locator('svg') }).first().click();

    // Change the degree title
    const degreeInput = page.getByPlaceholder('Degree title');
    await degreeInput.clear();
    await degreeInput.fill('B.A. Computer Science');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('B.A. Computer Science')).toBeVisible();
  });

  test('delete an education', async ({ page }) => {
    // Create one to safely delete
    await page.getByRole('button', { name: 'Add education' }).click();
    await page.getByPlaceholder('Institution name').fill('Temp University');
    await page.getByPlaceholder('Degree title').fill('Temp Degree');
    await page.getByPlaceholder('Graduation year').fill('2000');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Temp University')).toBeVisible();

    // Hover and delete
    const card = page.locator('div.border.rounded-lg').filter({ hasText: 'Temp University' });
    await card.hover();
    await card.locator('button.text-destructive').click();

    await expect(page.getByText('Temp University')).not.toBeVisible();
  });
});
