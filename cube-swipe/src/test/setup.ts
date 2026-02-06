import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock PWA install tracking
vi.mock('../usePWAInstallTracking', () => ({
  usePWAInstallTracking: () => {},
}))

// Mock useInstallPrompt hook
vi.mock('../hooks/useInstallPrompt', () => ({
  useInstallPrompt: () => ({
    isAppInstalled: false,
    handleInstall: vi.fn(),
    handleShare: vi.fn(),
  }),
}))

// Mock analytics functions
vi.mock('../analytics', () => ({
  trackEvent: vi.fn(),
  trackException: vi.fn(),
  trackMetric: vi.fn(),
  trackPageView: vi.fn(),
  trackDeviceInfo: vi.fn(),
  getDeviceInfo: vi.fn(() => ({})),
}))

// Mock static assets
vi.mock('/vite.svg', () => ({ default: 'mocked-vite-logo.svg' }))
vi.mock('*.svg', () => ({ default: 'mocked-logo.svg' }))
vi.mock('*.png', () => ({ default: 'mocked-image.png' }))
vi.mock('*.jpg', () => ({ default: 'mocked-image.jpg' }))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})
