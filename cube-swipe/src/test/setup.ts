import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock PWA install tracking
vi.mock('../usePWAInstallTracking', () => ({
  usePWAInstallTracking: () => {},
}))

// Mock InstallPrompt component
vi.mock('../InstallPrompt', () => ({
  InstallPrompt: () => null,
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
