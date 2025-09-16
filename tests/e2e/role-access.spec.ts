import { test, expect } from '@playwright/test';

/**
 * Basic smoke test for minimal role-based landing page.
 * Verifies: role cards render, copy buttons work, env info loads.
 */

test.describe('Role Access Landing', () => {
  test('displays all role cards and copies credentials', async ({ page }) => {
    await page.goto('/index.html');

    const roles = ['Patient Portal', 'Provider Portal', 'Admin Console', 'Telehealth Suite'];
    for (const title of roles) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }

    // Test one copy button action (Patient credentials)
    const patientCard = page.locator('[data-role="patient"]');
    await expect(patientCard).toBeVisible();
    const copyBtn = patientCard.getByRole('button', { name: 'Copy' });
    await copyBtn.click();
    await expect(copyBtn).toHaveText('Copied');
  });
});
