import { test, expect } from '@playwright/test'

// Seeded pseudo-random number generator for deterministic tile spawning
function seedRandom(seed: number) {
  return `
    (function() {
      let seed = ${seed};
      Math.random = function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    })();
  `
}

test.describe('Cube Swipe 2048 App', () => {
  test.beforeEach(async ({ page }) => {
    // Seed Math.random for deterministic tile spawning
    await page.addInitScript(seedRandom(12345))
  })

  test('should load and take screenshot', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Cube Swipe 2048' })).toBeVisible()

    // Save for manual review
    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-home.png`, fullPage: true, scale: 'device' })

    // Visual regression test
    await expect(page).toHaveScreenshot(`${testInfo.project.name}-home.png`, { fullPage: true })
  })

  test('should navigate to game mode selection', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page.getByRole('button', { name: 'Play Original 2048' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play Using Fibonacci Sequence' })).toBeVisible()

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-mode-select.png`, fullPage: true, scale: 'device' })
    await expect(page).toHaveScreenshot(`${testInfo.project.name}-mode-select.png`, { fullPage: true })
  })

  test('should navigate to game screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.getByRole('button', { name: 'Play Original 2048' }).click()
    await expect(page.getByText('Swipe, double-tap edges, or use arrow keys to play')).toBeVisible()
    await expect(page.getByText(/Score:/)).toBeVisible()

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-game.png`, fullPage: true, scale: 'device' })
    await expect(page).toHaveScreenshot(`${testInfo.project.name}-game.png`, { fullPage: true })
  })

  test('should navigate to About screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'About' }).click()
    await expect(page.getByRole('heading', { name: 'About Cube Swipe 2048' })).toBeVisible()

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-about.png`, fullPage: true, scale: 'device' })
    await expect(page).toHaveScreenshot(`${testInfo.project.name}-about.png`, { fullPage: true })
  })

  test('should navigate to Leave Comment screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Leave Comment' }).click()
    await expect(page.getByRole('heading', { name: 'Leave a Comment' })).toBeVisible()

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-comments.png`, fullPage: true, scale: 'device' })
    await expect(page).toHaveScreenshot(`${testInfo.project.name}-comments.png`, { fullPage: true })
  })

  test('should toggle theme', async ({ page }, testInfo) => {
    await page.goto('/')

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-light-mode.png`, fullPage: true, scale: 'device' })
    await expect(page).toHaveScreenshot(`${testInfo.project.name}-light-mode.png`, { fullPage: true })

    await page.getByLabel('Toggle theme').click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-dark-mode.png`, fullPage: true, scale: 'device' })
    await expect(page).toHaveScreenshot(`${testInfo.project.name}-dark-mode.png`, { fullPage: true })
  })
})
