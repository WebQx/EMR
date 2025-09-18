import { test, expect } from '@playwright/test';

/**
 * Portal smoke test
 * Ensures the Vite React portal bundle is deployed and renders root heading text.
 */

test.describe('Vite Portal', () => {
  test('loads portal root and shows heading', async ({ page }) => {
    await page.goto('/portal/');
    // Heading text from PortalApp
    await expect(page.getByRole('heading', { name: 'WebQX Portal' })).toBeVisible();
  });
});
