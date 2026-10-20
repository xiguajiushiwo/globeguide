import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test('search, save and build a portable trip', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search a city or place' }).fill('Louvre');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Results for “Louvre”' })).toBeVisible();
  await page.locator('a[href="/destinations/22222222-2222-4222-8222-222222222222/"]').click();
  await expect(page.getByRole('heading', { name: 'Paris', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('a[href="https://www.louvre.fr/en"]')).toBeVisible();

  await page.getByRole('button', { name: 'Save place' }).click();
  await expect(page.getByRole('button', { name: 'Saved in this browser' })).toBeVisible();
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Open menu' }).click();
  }
  await page.getByRole('link', { name: 'Saved places' }).click();
  await expect(page.getByRole('heading', { name: 'Your saved places' })).toBeVisible();
  await page.getByRole('link').filter({ hasText: 'Paris' }).click();
  await expect(page.getByRole('button', { name: 'Saved in this browser' })).toBeVisible();

  await page.getByRole('link', { name: 'Plan a trip' }).click();
  await expect(page.getByRole('combobox', { name: 'Destination', exact: true })).toHaveValue('22222222-2222-4222-8222-222222222222');
  await page.getByLabel('Trip name').fill('Paris research trip');
  await page.getByLabel('Start date').fill('2027-04-10');
  await page.getByLabel('End date').fill('2027-04-14');
  await page.locator('#trip-add-stop').selectOption({ label: 'Musée du Louvre' });
  await page.getByRole('button', { name: 'Add a place' }).click();
  await page.getByLabel('Notes').fill('Look up timed admission before leaving.');
  await page.getByRole('button', { name: 'Save trip' }).click();
  await expect(page.getByRole('status')).toContainText('Trip saved.');

  await page.reload();
  await expect(page.getByLabel('Trip name')).toHaveValue('Paris research trip');
  await expect(page.getByLabel('Notes')).toHaveValue('Look up timed admission before leaving.');
  await expect(page.locator('.trip-stops li')).toContainText(['Musée du Louvre']);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('globeguide-trips.json');
  const archive = await readFile(await download.path());
  expect(JSON.parse(archive.toString()).trips).toHaveLength(1);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete trip' }).click();
  await expect(page.getByText('No trips planned yet.')).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'globeguide-trips.json',
    mimeType: 'application/json',
    buffer: archive,
  });
  await expect(page.getByRole('status')).toContainText('Trips imported.');
  await page.reload();
  await expect(page.getByLabel('Trip name')).toHaveValue('Paris research trip');

  if (testInfo.project.name === 'mobile-chromium') {
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual((page.viewportSize()?.width ?? width) + 1);
  }
});
