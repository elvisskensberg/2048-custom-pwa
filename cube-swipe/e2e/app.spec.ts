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
    test.setTimeout(90000) // 90 seconds for 10 pages
    await page.goto('/')
    await page.getByRole('button', { name: 'About' }).click()
    await expect(page.getByText('Production Build')).toBeVisible()

    // Capture all 10 pages of the About section (10 selected variants)
    const baseTitles = [
      'Production Build',
      'Azure Cloud',
      'CI/CD Pipeline',
      'Testing',
      'Analytics',
      'Security',
      'Developer Experience',
      'E2E Testing',
      'UI/UX',
      'Layout & CSS',
    ]

    // Variants: mostly gradient, with card for topics 3-4 (Testing, Analytics)
    const variants = ['gradient', 'gradient', 'gradient', 'card', 'card', 'gradient', 'gradient', 'gradient', 'gradient', 'gradient']
    const allPages = baseTitles.map((title, index) => ({
      title,
      variant: variants[index],
      index: index + 1,
    }))

    for (let i = 0; i < allPages.length; i++) {
      const pageData = allPages[i]
      await expect(page.getByText(pageData.title, { exact: true }).first()).toBeVisible()

      // Save to device folder (for comprehensive device testing)
      await page.screenshot({
        path: `e2e/screenshots/${testInfo.project.name}/app-about-page${i + 1}.png`,
        fullPage: true,
        scale: 'device',
      })

      // Also save to story-mode folder (1:1 ratio for PDF generation) - only for Square-1080p
      if (testInfo.project.name === 'Square-1080p') {
        const pageNum = String(i + 1).padStart(2, '0')
        const slug = pageData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        await page.screenshot({
          path: `e2e/screenshots/story-mode/page${pageNum}-${slug}-${pageData.variant}.png`,
          fullPage: true,
          scale: 'device',
        })
      }

      // Navigate to next page (skip on last page)
      if (i < allPages.length - 1) {
        await page.getByLabel('Next page').click()
        await page.waitForTimeout(300) // Wait for navigation animation
      }
    }
  })

  test('should navigate to Templates screen', async ({ page }, testInfo) => {
    test.setTimeout(180000) // 3 minutes for 30 pages
    await page.goto('/')
    await page.getByRole('button', { name: 'Templates' }).click()
    await expect(page.getByText('Template Showcase')).toBeVisible()

    // Capture all 30 template pages (10 sets × 3 design variants)
    // All pages have same placeholder text, only design/colors differ
    const variants = ['gradient', 'card', 'minimal']
    const allPages = Array.from({ length: 10 }, (_, setIndex) =>
      variants.map((variant, variantIndex) => ({
        variant,
        index: setIndex * 3 + variantIndex + 1,
        set: setIndex + 1,
      })),
    ).flat()

    for (let i = 0; i < allPages.length; i++) {
      const pageData = allPages[i]
      await expect(page.getByText('Template Showcase', { exact: true }).first()).toBeVisible()

      // Save to Templates folder (1:1 ratio) - only for Square-1080p
      if (testInfo.project.name === 'Square-1080p') {
        const pageNum = String(i + 1).padStart(2, '0')
        await page.screenshot({
          path: `e2e/screenshots/Templates/template-${pageNum}-set${pageData.set}-${pageData.variant}.png`,
          fullPage: true,
          scale: 'device',
        })
      }

      // Navigate to next page (skip on last page)
      if (i < allPages.length - 1) {
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
