import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
    // Chunk size warning threshold (500 KB)
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', '@ionic/vue'],
  },
})
