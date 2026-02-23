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
    // --- Landscape profiles ---
    {
      name: 'iPhone 14 Landscape',
      use: {
        ...devices['iPhone 14'],
        viewport: { width: 844, height: 390 },
      },
    },
    {
      name: 'Galaxy S24 Ultra Landscape',
      use: {
        ...devices['Galaxy S9+'],
        viewport: { width: 915, height: 412 },
        deviceScaleFactor: 3.5,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iPad 11th Gen Landscape',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 1194, height: 834 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Galaxy Tab S10 Landscape',
      use: {
        ...devices['Galaxy Tab S4'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2.5,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Desktop-1080p Landscape',
      use: {
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
