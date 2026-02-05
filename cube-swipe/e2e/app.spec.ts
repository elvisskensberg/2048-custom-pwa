import { test, expect } from '@playwright/test'

test.describe('Cube Swipe 2048 App', () => {
  test('should load and take screenshot on iPhone 14', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')

    // Wait for the app to load
    await expect(page.getByRole('heading', { name: 'Cube Swipe 2048' })).toBeVisible()

    // Take a full page screenshot
    await page.screenshot({ path: 'e2e/screenshots/app-home-iphone14.png', fullPage: true })

    // Verify main menu buttons are visible
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'About' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Leave Comment' })).toBeVisible()

    // Verify theme toggle is visible
    const themeToggle = page.getByLabel('Toggle theme')
    await expect(themeToggle).toBeVisible()
  })

  test('should navigate to game screen', async ({ page }) => {
    await page.goto('/')

    // Click Start Game button
    await page.getByRole('button', { name: 'Start Game' }).click()

    // Verify game screen is shown
    await expect(page.getByText('Swipe left, right, up, or down to play')).toBeVisible()

    // Verify Back button is visible
    await expect(page.getByRole('button', { name: '← Back' })).toBeVisible()

    // Take screenshot of game screen
    await page.screenshot({ path: 'e2e/screenshots/app-game-iphone14.png', fullPage: true })
  })

  test('should navigate to About screen', async ({ page }) => {
    await page.goto('/')

    // Click About button
    await page.getByRole('button', { name: 'About' }).click()

    // Verify About screen is shown
    await expect(page.getByRole('heading', { name: 'About Cube Swipe 2048' })).toBeVisible()
    await expect(page.getByText(/modern take on the classic 2048/)).toBeVisible()

    // Take screenshot of About screen
    await page.screenshot({ path: 'e2e/screenshots/app-about-iphone14.png', fullPage: true })
  })

  test('should navigate to Leave Comment screen', async ({ page }) => {
    await page.goto('/')

    // Click Leave Comment button
    await page.getByRole('button', { name: 'Leave Comment' }).click()

    // Verify Leave Comment screen is shown
    await expect(page.getByRole('heading', { name: 'Leave a Comment' })).toBeVisible()
    await expect(page.getByLabel('Contact Info (Email/Name)')).toBeVisible()
    await expect(page.getByLabel('Comments')).toBeVisible()

    // Take screenshot of Leave Comment screen
    await page.screenshot({ path: 'e2e/screenshots/app-comments-iphone14.png', fullPage: true })
  })

  test('should toggle theme', async ({ page }) => {
    await page.goto('/')

    // Take screenshot in light mode
    await page.screenshot({ path: 'e2e/screenshots/app-light-mode-iphone14.png', fullPage: true })

    // Click theme toggle
    await page.getByLabel('Toggle theme').click()

    // Wait for theme to change
    await page.waitForTimeout(500)

    // Take screenshot in dark mode
    await page.screenshot({ path: 'e2e/screenshots/app-dark-mode-iphone14.png', fullPage: true })
  })
})
