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

  test('displays about text from seeded data', async ({ page }) => {
    await expect(page.getByText('I am a full-stack engineer who thrives at the intersection')).toBeVisible();
  });

  test('displays field labels', async ({ page }) => {
    for (const label of ['Name', 'Email', 'Phone', 'Location', 'About']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('can edit location field inline', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit Location' }).click({ force: true });

    const locationInput = page.getByRole('textbox');
    await expect(locationInput).toBeVisible();
    await locationInput.clear();
    await locationInput.fill('New York, NY');

    await page.getByRole('button', { name: 'Save Location' }).click();

    await expect(page.getByText('New York, NY')).toBeVisible();
  });

  test('can edit about field inline', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit About' }).click({ force: true });

    const aboutTextarea = page.getByRole('textbox');
    await expect(aboutTextarea).toBeVisible();
    await aboutTextarea.clear();
    await aboutTextarea.fill('Updated professional narrative.');

    await page.getByRole('button', { name: 'Save About' }).click();

    await expect(page.getByText('Updated professional narrative.')).toBeVisible();
  });

  test('cancel discards changes', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit Phone' }).click({ force: true });

    const phoneInput = page.getByRole('textbox');
    await phoneInput.clear();
    await phoneInput.fill('000-000-0000');

    await page.getByRole('button', { name: 'Cancel Phone' }).click();

    await expect(page.getByText('000-000-0000')).not.toBeVisible();
    await expect(page.getByText('+1-555-123-4567')).toBeVisible();
  });

  test('can edit first name and last name', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit Name' }).click({ force: true });

    const inputs = page.getByRole('textbox');
    await expect(inputs.first()).toHaveValue('Jane');
    await expect(inputs.nth(1)).toHaveValue('Doe');

    await inputs.first().clear();
    await inputs.first().fill('Alice');

    await page.getByRole('button', { name: 'Save Name' }).click();

    await expect(page.getByText('Alice Doe')).toBeVisible();
  });
});
