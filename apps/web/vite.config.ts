import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // .env files live at the monorepo root (shared with scripts/)
  envDir: path.resolve(import.meta.dirname, '../..'),
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // 'prompt': a new version waits for the user (update banner), see src/lib/appUpdates.ts
      registerType: 'prompt',
      manifest: {
        name: 'Livenotes',
        short_name: 'Livenotes',
        description: 'Manage your music setlists',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    // Unit tests only (e2e/ is run by Playwright); includes the shared packages
    include: ['src/**/*.{test,spec}.ts', '../../packages/*/src/**/*.{test,spec}.ts'],
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/main.ts',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        '**/*.config.*',
      ],
    },
  },
  build: {
    // Enable code splitting for better caching
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Vendor chunk for third-party libraries
            { name: 'vendor', test: /node_modules[\\/](vue|vue-router|pinia|@vue)[\\/]/ },
            // Supabase in separate chunk
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],
  },
})
