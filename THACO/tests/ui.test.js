import { test, expect } from '@playwright/test';

test('THACO calculator computes needed roll correctly', async ({ page }) => {
  await page.goto('/');

  // Fill in the inputs
  await page.fill('#thaco-input', '20');
  await page.fill('#ac-input', '10');
  await page.fill('#bonus-input', '0');

  // Check the needed roll
  await expect(page.locator('#result-value')).toHaveText('10');

  // Click roll button
  await page.click('#roll-btn');

  // Check that roll output appears
  await expect(page.locator('#roll-output')).not.toHaveClass('empty');
  const rollValue = await page.locator('#roll-value').textContent();
  expect(parseInt(rollValue)).toBeGreaterThanOrEqual(1);
  expect(parseInt(rollValue)).toBeLessThanOrEqual(20);

  // Check result
  const rollResult = await page.locator('#roll-result').textContent();
  expect(['Hit', 'Miss']).toContain(rollResult);
});

test('THACO calculator persists state across reloads', async ({ page }) => {
  await page.goto('/');

  // Fill in the inputs with non-default values
  await page.fill('#thaco-input', '18');
  await page.fill('#ac-input', '5');
  await page.fill('#bonus-input', '2');

  // Verify result value is updated
  await expect(page.locator('#result-value')).toHaveText('11');

  // Reload the page
  await page.reload();

  // Check if the values are still there
  await expect(page.locator('#thaco-input')).toHaveValue('18');
  await expect(page.locator('#ac-input')).toHaveValue('5');
  await expect(page.locator('#bonus-input')).toHaveValue('2');
  await expect(page.locator('#result-value')).toHaveText('11');
});

test('THACO calculator supports multiple entries', async ({ page }) => {
  await page.goto('/');

  // Initial entry
  await page.fill('#entry-name-input', 'Longsword');
  await page.fill('#thaco-input', '18');
  await page.fill('#ac-input', '5');
  await page.fill('#bonus-input', '2');
  await expect(page.locator('#result-value')).toHaveText('11');

  // Add a new entry
  await page.click('#add-entry-btn');
  await expect(page.locator('#entry-select')).toHaveValue('1');

  // Fill new entry
  await page.fill('#entry-name-input', 'Unarmed');
  await page.fill('#thaco-input', '20');
  await page.fill('#ac-input', '10');
  await page.fill('#bonus-input', '0');
  await expect(page.locator('#result-value')).toHaveText('10');

  // Switch back to first entry
  await page.selectOption('#entry-select', '0');
  await expect(page.locator('#entry-name-input')).toHaveValue('Longsword');
  await expect(page.locator('#thaco-input')).toHaveValue('18');
  await expect(page.locator('#result-value')).toHaveText('11');

  // Reload and check persistence
  await page.reload();
  await expect(page.locator('#entry-select')).toHaveValue('0');
  await expect(page.locator('#entry-name-input')).toHaveValue('Longsword');

  await page.selectOption('#entry-select', '1');
  await expect(page.locator('#entry-name-input')).toHaveValue('Unarmed');
  await expect(page.locator('#thaco-input')).toHaveValue('20');

  // Delete an entry
  await page.click('#delete-entry-btn');
  await expect(page.locator('#entry-select')).toHaveCount(1);
  await expect(page.locator('#entry-name-input')).toHaveValue('Longsword');
});
