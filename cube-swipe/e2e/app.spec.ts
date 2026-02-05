import { test, expect } from '@playwright/test'

test.describe('Cube Swipe 2048 App', () => {
  test('should load and take screenshot on iPhone 14', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Cube Swipe 2048' })).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/app-home-iphone14.png', fullPage: true })
  })

  test('should navigate to game screen', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page.getByText('Swipe left, right, up, or down to play')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/app-game-iphone14.png', fullPage: true })
  })

  test('should navigate to About screen', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'About' }).click()
    await expect(page.getByRole('heading', { name: 'About Cube Swipe 2048' })).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/app-about-iphone14.png', fullPage: true })
  })

  test('should navigate to Leave Comment screen', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Leave Comment' }).click()
    await expect(page.getByRole('heading', { name: 'Leave a Comment' })).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/app-comments-iphone14.png', fullPage: true })
  })

  test('should toggle theme', async ({ page }) => {
    await page.goto('/')
    await page.screenshot({ path: 'e2e/screenshots/app-light-mode-iphone14.png', fullPage: true })
    await page.getByLabel('Toggle theme').click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/screenshots/app-dark-mode-iphone14.png', fullPage: true })
  })
})
