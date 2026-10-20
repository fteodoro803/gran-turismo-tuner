import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base './' keeps asset paths relative: the portfolio serves this app from /lab/<id>/, not the site root
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    // jsdom gives component tests a fake browser DOM; the plain tune tests don't care.
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
