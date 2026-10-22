import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from GitHub Pages at /fueldrop-mvp/ (override with BASE=/ for local/root hosting)
export default defineConfig({
  base: process.env.BASE_PATH || '/fueldrop-mvp/',
  plugins: [react()],
})
