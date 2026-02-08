import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login page', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill('invalid@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access settings without auth
    await page.goto('/settings');
    await expect(page).toHaveURL('/login');

    // Try to access an article
    await page.goto('/articles/some-id');
    await expect(page).toHaveURL('/login');
  });
});
