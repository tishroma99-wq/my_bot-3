import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base должен совпадать с именем репозитория на GitHub Pages,
// напр. если репо называется "web-4" -> base: '/web-4/'
export default defineConfig({
  plugins: [react()],
  base: '/web-4/',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
  }
})
