import { expect, test } from '@playwright/test';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('displays profile heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
  });

  test('shows profile fields from seeded data', async ({ page }) => {
    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText('jane@example.com')).toBeVisible();
    await expect(page.getByText('+1-555-123-4567')).toBeVisible();
    await expect(page.getByText('San Francisco, CA')).toBeVisible();
    await expect(page.getByText('https://linkedin.com/in/janedoe')).toBeVisible();
    await expect(page.getByText('https://github.com/janedoe')).toBeVisible();
    await expect(page.getByText('https://janedoe.dev')).toBeVisible();
  });

  test('displays field labels', async ({ page }) => {
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Phone')).toBeVisible();
    await expect(page.getByText('Location')).toBeVisible();
  });
});
