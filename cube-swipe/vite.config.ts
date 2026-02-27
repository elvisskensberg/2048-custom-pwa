import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon-180x180.png',
        'vite.svg',
      ],
      manifest: {
        id: '/',
        name: 'Cube Swipe 2048',
        short_name: 'CubeSwipe',
        description: 'A professional 3D swipe-based 2048 puzzle game. Play classic or Fibonacci mode offline.',
        theme_color: '#ffffff',
        background_color: '#242424',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        categories: ['games', 'entertainment'],
        launch_handler: {
          client_mode: 'focus-existing',
        },
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Play Game',
            short_name: 'Play',
            url: '/?action=play',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'About',
            short_name: 'About',
            url: '/?action=about',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Cube Swipe 2048 – mobile gameplay',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Cube Swipe 2048 – desktop gameplay',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        navigationPreload: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          // Google Fonts stylesheets - CacheFirst (1 year)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts font files - CacheFirst (1 year, immutable)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Application Insights - Network only (no caching)
          {
            urlPattern: /^https:\/\/.*\.applicationinsights\.io\/.*/i,
            handler: 'NetworkOnly',
          },
          // Game assets (images, sounds) - StaleWhileRevalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'game-assets-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          // API calls - NetworkFirst, fallback to cache
          {
            urlPattern: /^https:\/\/script\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 5 * 60,
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['@react-spring/web', '@use-gesture/react'],
        },
      },
    },
    cssMinify: true,
    sourcemap: false,
  },
})
