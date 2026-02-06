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

test.describe('Elvis Skensberg AI Showcase', () => {
  test.beforeEach(async ({ page }) => {
    // Seed Math.random for deterministic tile spawning
    await page.addInitScript(seedRandom(12345))
  })

  test('should load and take screenshot', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Elvis Skensberg AI Showcase' })).toBeVisible()

    // Save for manual review
    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-home.png`, fullPage: true, scale: 'device' })
  })

  test('should navigate to game mode selection', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Play 2048' }).click()
    await expect(page.getByRole('button', { name: 'Play Original 2048' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play Using Fibonacci Sequence' })).toBeVisible()

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-mode-select.png`, fullPage: true, scale: 'device' })
  })

  test('should navigate to game screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Play 2048' }).click()
    await page.getByRole('button', { name: 'Play Original 2048' }).click()
    await expect(page.getByText('Swipe, double-tap edges, or use arrow keys to play')).toBeVisible()
    await expect(page.getByText(/Score:/)).toBeVisible()

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-game.png`, fullPage: true, scale: 'device' })
  })

  test('should navigate to About screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'About' }).click()
    await expect(page.getByRole('heading', { name: 'Production Build (Making It Fast™)' })).toBeVisible()

    // Capture all 10 pages of the About section
    const pages = [
      'Production Build (Making It Fast™)',
      'Azure Cloud (Microsoft Money Pit)',
      'CI/CD Pipeline (Robots Deploying Robots)',
      'Testing (Trust But Verify)',
      'Analytics (Big Brother, But Helpful)',
      'Security (Keeping Secrets Secret)',
      'Developer Experience (Not Terrible)',
      'E2E Testing (Testing Like Users Do)',
      'UI/UX (Making It Pretty)',
      'Layout & CSS (The 100vw Bug of 2025)',
    ]

    for (let i = 0; i < pages.length; i++) {
      await expect(page.getByRole('heading', { name: pages[i] })).toBeVisible()

      // Save to device folder (for comprehensive device testing)
      await page.screenshot({
        path: `e2e/screenshots/${testInfo.project.name}/app-about-page${i + 1}.png`,
        fullPage: true,
        scale: 'device',
      })

      // Also save to story-mode folder (1:1 ratio for PDF generation) - only for Square-1080p
      if (testInfo.project.name === 'Square-1080p') {
        await page.screenshot({
          path: `e2e/screenshots/story-mode/page${i + 1}-${pages[i].toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
          fullPage: true,
          scale: 'device',
        })
      }

      // Navigate to next page (skip on last page)
      if (i < pages.length - 1) {
        await page.getByLabel('Next page').click()
        await page.waitForTimeout(300) // Wait for navigation animation
      }
    }
  })

  test('should navigate to Leave Comment screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Leave Comment' }).click()
    await expect(page.getByRole('heading', { name: 'Leave a Comment' })).toBeVisible()

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-comments.png`, fullPage: true, scale: 'device' })
  })

  test('should toggle theme', async ({ page }, testInfo) => {
    await page.goto('/')

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-light-mode.png`, fullPage: true, scale: 'device' })

    await page.getByLabel('Toggle theme').click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-dark-mode.png`, fullPage: true, scale: 'device' })
  })
})
