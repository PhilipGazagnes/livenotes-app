import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // .env files live at the monorepo root (shared with scripts/)
  envDir: path.resolve(__dirname, '../..'),
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
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
      '@': path.resolve(__dirname, './src'),
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
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for third-party libraries
          'vendor': ['vue', 'vue-router', 'pinia'],
          // Ionic components in separate chunk
          'ionic': ['@ionic/vue', '@ionic/vue-router'],
          // Supabase in separate chunk
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Use esbuild for minification (faster than terser, built into Vite)
    minify: 'esbuild',
    // Note: To remove console.logs, install terser: npm install -D terser
    // Then change minify to 'terser' and add terserOptions
    // Chunk size warning threshold. The Ionic chunk (~1 MB) is the only one
    // above 500 KB; back to 500 once Ionic is removed (ADR-003, Phase 2).
    chunkSizeWarningLimit: 1100,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', '@ionic/vue'],
  },
})
