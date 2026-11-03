import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test('Japan map keeps alternative day routes and themed places usable together', async ({ page }) => {
  await page.goto('/guides/japan/');
  const explorer = page.locator('.japan-route-explorer');
  await explorer.getByRole('button', { name: /^D7/ }).click();
  await expect(explorer.locator('.japan-route-stops')).toContainText('伏见稻荷');
  await expect(explorer.locator('.japan-route-stops')).not.toContainText('岚山');
  await explorer.getByRole('button', { name: '岚山', exact: true }).click();
  await expect(explorer.locator('.japan-route-stops')).toContainText('岚山');
  await expect(explorer.locator('.japan-route-stops')).not.toContainText('伏见稻荷');
  await explorer.getByRole('button', { name: '主题地点', exact: true }).click();
  await explorer.getByRole('searchbox', { name: '搜索地点或作品' }).fill('你的名字。');
  await expect(explorer.locator('.japan-theme-list')).toContainText('须贺神社');
  await explorer.getByRole('button', { name: '逐日路线', exact: true }).click();
  await expect(explorer.locator('.japan-route-stops')).toContainText('岚山');
  await expect(explorer.locator('.japan-route-details')).toContainText('京都站');
});

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
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  if (await menuButton.isVisible()) {
    await menuButton.click();
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
  expect(download.suggestedFilename()).toBe('wayella-trips.json');
  const archive = await readFile(await download.path());
  expect(JSON.parse(archive.toString()).trips).toHaveLength(1);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete trip' }).click();
  await expect(page.getByText('No trips planned yet.')).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'wayella-trips.json',
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

test('discover Travel Notes and open an editorial reference', async ({ page }, testInfo) => {
  await page.goto('/stories/');
  await expect(page.getByRole('heading', { name: 'Travel Notes', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Guides', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Moments', exact: true })).toBeVisible();
  await expect(page.getByText('Wayella editorial picks')).toBeVisible();

  await page.getByRole('tab', { name: 'Guides', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build a neighborhood day in Paris', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Build a neighborhood day in Paris', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build a neighborhood day in Paris', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Paris tourist information/ })).toBeVisible();

  if (testInfo.project.name === 'mobile-chromium') {
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual((page.viewportSize()?.width ?? width) + 1);
  }
});
