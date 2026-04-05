import { expect, test } from '@playwright/test';

test.describe('Profile Page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('displays heading and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
    await expect(page.getByText('Your professional identity.')).toBeVisible();
  });

  test('shows all field labels', async ({ page }) => {
    // Profile displays as content-first (ProfileDisplay). Check that seeded values are visible as text.
    await expect(page.getByText('Jane')).toBeVisible();
    await expect(page.getByText('Doe')).toBeVisible();
    await expect(page.getByText('jane@example.com')).toBeVisible();
    await expect(page.getByText('+1-555-123-4567')).toBeVisible();
    await expect(page.getByText('San Francisco, CA')).toBeVisible();
  });

  test('shows seeded data in inputs', async ({ page }) => {
    await expect(page.getByLabel('First Name')).toHaveValue('Jane');
    await expect(page.getByLabel('Last Name')).toHaveValue('Doe');
    await expect(page.getByLabel('Email')).toHaveValue('jane@example.com');
    await expect(page.getByLabel('Phone')).toHaveValue('+1-555-123-4567');
    await expect(page.getByLabel('Location')).toHaveValue('San Francisco, CA');
    await expect(page.getByLabel('LinkedIn')).toHaveValue('https://linkedin.com/in/janedoe');
    await expect(page.getByLabel('GitHub')).toHaveValue('https://github.com/janedoe');
    await expect(page.getByLabel('Website')).toHaveValue('https://janedoe.dev');
    await expect(page.getByLabel('About')).toHaveValue(
      'I am a full-stack engineer who thrives at the intersection of product and infrastructure. I write clear, maintainable code and care deeply about developer experience and system reliability.'
    );
  });

  test('SaveBar hidden when no fields are dirty', async ({ page }) => {
    await expect(page.locator('[data-slot="save-bar"]')).not.toBeVisible();
  });

  test('editing a field shows SaveBar with dirty count', async ({ page }) => {
    await page.getByLabel('First Name').clear();
    await page.getByLabel('First Name').fill('Alice');
    await expect(page.locator('[data-slot="save-bar"]')).toBeVisible();
    await expect(page.locator('[data-slot="save-bar"]')).toContainText('1 unsaved change');

    await page.getByLabel('Location').clear();
    await page.getByLabel('Location').fill('New York, NY');
    await expect(page.locator('[data-slot="save-bar"]')).toContainText('2 unsaved changes');
  });

  test('save name via SaveBar', async ({ page }) => {
    await page.getByLabel('First Name').clear();
    await page.getByLabel('First Name').fill('Alice');

    const saveBar = page.locator('[data-slot="save-bar"]');
    await saveBar.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
    await expect(saveBar).not.toBeVisible();
    await expect(page.getByLabel('First Name')).toHaveValue('Alice');
  });

  test('save email via SaveBar', async ({ page }) => {
    await page.getByLabel('Email').clear();
    await page.getByLabel('Email').fill('alice@test.com');

    await page.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
  });

  test('save phone via SaveBar', async ({ page }) => {
    await page.getByLabel('Phone').clear();
    await page.getByLabel('Phone').fill('555-000-1111');

    await page.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
  });

  test('save social links via SaveBar', async ({ page }) => {
    await page.getByLabel('LinkedIn').clear();
    await page.getByLabel('LinkedIn').fill('https://linkedin.com/in/alice');
    await page.getByLabel('GitHub').clear();
    await page.getByLabel('GitHub').fill('https://github.com/alice');
    await page.getByLabel('Website').clear();
    await page.getByLabel('Website').fill('https://alice.dev');

    const saveBar = page.locator('[data-slot="save-bar"]');
    await expect(saveBar).toContainText('3 unsaved changes');
    await saveBar.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
  });

  test('save about text via SaveBar', async ({ page }) => {
    await page.getByLabel('About').clear();
    await page.getByLabel('About').fill('Updated professional narrative for testing.');

    await page.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();
  });

  test('discard reverts all dirty fields', async ({ page }) => {
    // Read current values before editing (may differ from seed if prior tests mutated)
    const originalFirstName = await page.getByLabel('First Name').inputValue();
    const originalLocation = await page.getByLabel('Location').inputValue();

    await page.getByLabel('First Name').clear();
    await page.getByLabel('First Name').fill('DISCARD_TEST_NAME');
    await page.getByLabel('Location').clear();
    await page.getByLabel('Location').fill('DISCARD_TEST_LOCATION');

    const saveBar = page.locator('[data-slot="save-bar"]');
    await saveBar.getByRole('button', { name: 'Discard' }).click();

    await expect(saveBar).not.toBeVisible();
    await expect(page.getByLabel('First Name')).toHaveValue(originalFirstName);
    await expect(page.getByLabel('Location')).toHaveValue(originalLocation);
  });

  test('validation: empty required fields show errors on save', async ({ page }) => {
    await page.getByLabel('First Name').clear();
    await page.getByLabel('Last Name').clear();
    await page.getByLabel('Email').clear();

    await page.locator('[data-slot="save-bar"]').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
  });
});
