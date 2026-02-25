/**
 * Generate PWA icon files using Playwright.
 *
 * Renders a simple 2048-themed icon (gradient background + "2048" text)
 * at every required size and writes PNGs into public/.
 *
 * Usage:  node scripts/generate-pwa-icons.mjs
 */
import { chromium } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public')

const ICON_SIZES = [
  { name: 'favicon-16x16.png', size: 16, maskable: false },
  { name: 'favicon-32x32.png', size: 32, maskable: false },
  { name: 'apple-touch-icon-180x180.png', size: 180, maskable: false },
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
]

function buildIconHTML(size, maskable) {
  const padding = maskable ? size * 0.2 : size * 0.08
  const innerSize = size - padding * 2
  const fontSize = Math.round(innerSize * 0.28)
  const subFontSize = Math.round(innerSize * 0.12)
  const borderRadius = maskable ? 0 : Math.round(size * 0.18)

  return `<!DOCTYPE html>
<html>
<head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${size}px;
    height: ${size}px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${maskable ? 'linear-gradient(135deg, #6750A4 0%, #9C27B0 50%, #E040FB 100%)' : 'transparent'};
  }
  .icon-box {
    width: ${innerSize}px;
    height: ${innerSize}px;
    border-radius: ${borderRadius}px;
    background: linear-gradient(135deg, #6750A4 0%, #9C27B0 50%, #E040FB 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: ${maskable ? 'none' : `0 ${Math.round(size * 0.02)}px ${Math.round(size * 0.06)}px rgba(0,0,0,0.3)`};
  }
  .number { font-size: ${fontSize}px; font-weight: 900; letter-spacing: -1px; line-height: 1; }
  .label { font-size: ${subFontSize}px; font-weight: 600; opacity: 0.9; margin-top: ${Math.round(innerSize * 0.02)}px; }
</style></head>
<body>
  <div class="icon-box">
    <div class="number">2048</div>
    ${size >= 64 ? '<div class="label">CUBE SWIPE</div>' : ''}
  </div>
</body>
</html>`
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()

  for (const { name, size, maskable } of ICON_SIZES) {
    const page = await context.newPage()
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(buildIconHTML(size, maskable))
    await page.screenshot({
      path: path.join(PUBLIC_DIR, name),
      omitBackground: !maskable,
    })
    await page.close()
    console.log(`Generated ${name} (${size}x${size}${maskable ? ', maskable' : ''})`)
  }

  await browser.close()
  console.log('\nAll PWA icons generated in public/')
}

main().catch((err) => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
