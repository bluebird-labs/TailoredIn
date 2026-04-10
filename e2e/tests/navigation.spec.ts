import { expect, test } from '@playwright/test';

const sidebar = '[data-sidebar="sidebar"]';

test.describe('Navigation & Routing', () => {
  test('home redirects to /jobs', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/jobs');
    await expect(page).toHaveURL(/\/jobs/);
  });

  test('sidebar has all five nav items', async ({ page }) => {
    await page.goto('/profile');
    const nav = page.locator(sidebar);
    await expect(nav.getByText('Atelier')).toBeVisible();
    await expect(nav.getByText('Profile')).toBeVisible();
    await expect(nav.getByText('Settings')).toBeVisible();
    await expect(nav.getByText('Jobs')).toBeVisible();
    await expect(nav.getByText('Companies')).toBeVisible();
  });

  test('sidebar Profile navigates to /profile', async ({ page }) => {
    await page.goto('/jobs');
    await page.locator(sidebar).getByText('Profile').click();
    await page.waitForURL('/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
  });

  test('sidebar Jobs navigates to /jobs', async ({ page }) => {
    await page.goto('/profile');
    await page.locator(sidebar).getByText('Jobs').click();
    await page.waitForURL('/jobs');
    await expect(page.getByRole('heading', { level: 1, name: 'Jobs' })).toBeVisible();
  });

  test('sidebar Companies navigates to /companies', async ({ page }) => {
    await page.goto('/profile');
    await page.locator(sidebar).getByText('Companies').click();
    await page.waitForURL('/companies');
    await expect(page.getByRole('heading', { level: 1, name: 'Companies' })).toBeVisible();
  });

  test('active sidebar item highlights correctly on each route', async ({ page }) => {
    const routes = [
      { path: '/profile', label: 'Profile' },
      { path: '/jobs', label: 'Jobs' },
      { path: '/companies', label: 'Companies' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      const activeButton = page.locator(sidebar).locator('[data-active]');
      await expect(activeButton).toContainText(route.label);
    }
  });
});
