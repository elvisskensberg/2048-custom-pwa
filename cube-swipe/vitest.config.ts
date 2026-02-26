import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'virtual:pwa-register/react': path.resolve(__dirname, './src/test/mocks/pwa-register.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**',
      '**/*.config.*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.*',
        '**/dist/**',
      ],
      thresholds: {
        statements: 60,
        branches: 45,
        functions: 60,
        lines: 60,
        'src/monopoly-deal/aiStrategy.ts': {
          statements: 85,
          branches: 65,
          functions: 95,
          lines: 85,
        },
        'src/monopoly-deal/gameEngine.ts': {
          statements: 75,
          branches: 55,
          functions: 85,
          lines: 75,
        },
      },
    },
    // Mock static assets
    mockReset: true,
    restoreMocks: true,
  }
})
