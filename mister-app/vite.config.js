import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import precache from './build/precache.js'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serve il sito su /<nome-repo>/
  base: '/ct-soccer26/',
  plugins: [react(), precache()],
})
