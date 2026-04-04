import { expect, test } from '@playwright/test';

const sidebar = '[data-sidebar="sidebar"]';

test.describe('Navigation & Routing', () => {
  test('home redirects to /profile', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/profile');
    await expect(page).toHaveURL(/\/profile/);
  });

  test('sidebar has all four nav items', async ({ page }) => {
    await page.goto('/profile');
    const nav = page.locator(sidebar);
    await expect(nav.getByText('Profile')).toBeVisible();
    await expect(nav.getByText('Experiences')).toBeVisible();
    await expect(nav.getByText('Headlines')).toBeVisible();
    await expect(nav.getByText('Education')).toBeVisible();
  });

  test('sidebar Profile navigates to /profile', async ({ page }) => {
    await page.goto('/experiences');
    await page.locator(sidebar).getByText('Profile').click();
    await page.waitForURL('/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
  });

  test('sidebar Experiences navigates to /experiences', async ({ page }) => {
    await page.goto('/profile');
    await page.locator(sidebar).getByText('Experiences').click();
    await page.waitForURL('/experiences');
    await expect(page.getByRole('heading', { level: 1, name: 'Experiences' })).toBeVisible();
  });

  test('sidebar Headlines navigates to /headlines', async ({ page }) => {
    await page.goto('/profile');
    await page.locator(sidebar).getByText('Headlines').click();
    await page.waitForURL('/headlines');
    await expect(page.getByRole('heading', { level: 1, name: 'Headlines' })).toBeVisible();
  });

  test('sidebar Education navigates to /education', async ({ page }) => {
    await page.goto('/profile');
    await page.locator(sidebar).getByText('Education').click();
    await page.waitForURL('/education');
    await expect(page.getByRole('heading', { level: 1, name: 'Education' })).toBeVisible();
  });

  test('active sidebar item highlights correctly on each route', async ({ page }) => {
    const routes = [
      { path: '/profile', label: 'Profile' },
      { path: '/experiences', label: 'Experiences' },
      { path: '/headlines', label: 'Headlines' },
      { path: '/education', label: 'Education' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      const activeButton = page.locator(sidebar).locator('[data-active]');
      await expect(activeButton).toContainText(route.label);
    }
  });

  test('/resume no longer renders wardrobe page', async ({ page }) => {
    await page.goto('/resume');
    await expect(page.getByText('Wardrobe')).not.toBeVisible();
  });
});
