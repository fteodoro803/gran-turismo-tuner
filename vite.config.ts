import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' keeps asset paths relative: the portfolio serves this app from /lab/<id>/, not the site root
export default defineConfig({
  base: './',
  plugins: [react()],
})
