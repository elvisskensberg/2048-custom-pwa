import { defineConfig, devices } from '@playwright/test'

// TODO: Convert generated 1:1 ratio screenshots to PDF format for documentation
// Square viewport ensures consistent aspect ratio for PDF conversion
// Recommended tools: ImageMagick, wkhtmltopdf, or Puppeteer PDF generation

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03, // Allow 3% pixel difference for cross-platform rendering
      threshold: 0.2, // Per-pixel color difference threshold
    },
  },
  projects: [
    {
      name: 'Square-1080p', // 1:1 ratio for PDF conversion
      use: {
        viewport: { width: 1080, height: 1080 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
      },
    },
    {
      name: 'iPhone 14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Galaxy S24 Ultra',
      use: {
        ...devices['Galaxy S9+'], // Base Android device
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 3.5,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iPad 11th Gen',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 834, height: 1194 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Galaxy Tab S10',
      use: {
        ...devices['Galaxy Tab S4'], // Base Android tablet
        viewport: { width: 800, height: 1280 },
        deviceScaleFactor: 2.5,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
