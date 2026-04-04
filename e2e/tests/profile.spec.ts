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
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Phone')).toBeVisible();
    await expect(page.getByText('Location')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
  });

  test('can edit profile fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit profile' }).click();

    const locationInput = page.getByLabel('Location');
    await expect(locationInput).toBeVisible();
    await locationInput.clear();
    await locationInput.fill('New York, NY');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('New York, NY')).toBeVisible();
    await expect(page.getByLabel('Location')).not.toBeVisible();
  });

  test('can edit about field', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit profile' }).click();

    const aboutTextarea = page.getByLabel('About');
    await expect(aboutTextarea).toBeVisible();
    await aboutTextarea.clear();
    await aboutTextarea.fill('Updated professional narrative.');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Updated professional narrative.')).toBeVisible();
    await expect(page.getByLabel('About')).not.toBeVisible();
  });

  test('cancel discards changes', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit profile' }).click();

    const locationInput = page.getByLabel('Location');
    await locationInput.clear();
    await locationInput.fill('Discarded City');

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Discarded City')).not.toBeVisible();
    await expect(page.getByLabel('Location')).not.toBeVisible();
  });

  test('can edit first name and last name separately', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit profile' }).click();

    const firstNameInput = page.getByLabel('First name');
    const lastNameInput = page.getByLabel('Last name');
    await expect(firstNameInput).toHaveValue('Jane');
    await expect(lastNameInput).toHaveValue('Doe');

    await firstNameInput.clear();
    await firstNameInput.fill('Alice');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Alice Doe')).toBeVisible();
  });
});
