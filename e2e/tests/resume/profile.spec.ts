import { expect, test } from '@playwright/test';

test.describe('Profile smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  });

  test('loads seeded profile data', async ({ page }) => {
    await expect(page.getByLabel('First name')).toHaveValue('Sylvain');
    await expect(page.getByLabel('Last name')).toHaveValue('Estevez');
    await expect(page.getByLabel('Email')).toHaveValue('estevez.sylvain@gmail.com');
    await expect(page.getByLabel('Phone number')).not.toHaveValue('');
    await expect(page.getByLabel('Location')).toHaveValue('New York, NY');

    // Form is clean — buttons should be disabled
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  test('edits a field, saves, persists on reload', async ({ page }) => {
    const phoneInput = page.getByLabel('Phone number');
    await phoneInput.clear();
    await phoneInput.fill('+1 555 000 1234');

    // Form is dirty — Save should be enabled
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Profile updated')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByLabel('Phone number')).toHaveValue('+1 555 000 1234');
  });
});
