import { test, expect } from '@playwright/test';

test('Hero section loads and renders WebGL', async ({ page }) => {
  await page.goto('http://localhost:4321');

  // Wait for the hero component to hydrate
  await page.waitForSelector('astro-island[uid^="Z"]', { timeout: 30000 });

  // Check for canvas element (WebGL renderer)
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10000 });

  // Take a screenshot
  await page.screenshot({ path: 'hero-screenshot.png', fullPage: true });

  // Check hero content is present - use the hero-specific h1 (first one)
  await expect(page.locator('h1').first()).toContainText('CapirelAI');
  await expect(page.locator('text=Forum • Est. 2026')).toBeVisible();
});

test('Hero responds to mouse movement', async ({ page }) => {
  await page.goto('http://localhost:4321');

  // Wait for canvas
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10000 });

  // Get canvas bounding box
  const box = await canvas.boundingBox();
  if (box) {
    // Move mouse to center of canvas
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);

    // Move mouse to different position
    await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'hero-mouse-interaction.png', fullPage: true });
});