import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// En Vercel el base es '/', en GitHub Pages es '/administrativo2026ceia/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/administrativo2026ceia/',
})
