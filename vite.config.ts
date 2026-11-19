import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // e2e/ is a separate Playwright project with its own runner.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
