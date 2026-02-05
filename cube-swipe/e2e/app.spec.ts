import { test, expect } from '@playwright/test'

test.describe('Cube Swipe 2048 App', () => {
  test('should load and take screenshot', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Cube Swipe 2048' })).toBeVisible()
    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-home.png`, fullPage: true, scale: 'device' })
  })

  test('should navigate to game screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page.getByText('Swipe left, right, up, or down to play')).toBeVisible()
    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-game.png`, fullPage: true, scale: 'device' })
  })

  test('should navigate to About screen', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'About' }).click()
    await expect(page.getByRole('heading', { name: 'About Cube Swipe 2048' })).toBeVisible()
    await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/app-about.png`, fullPage: true, scale: 'device' })
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
