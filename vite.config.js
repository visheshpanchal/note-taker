import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw'],
    // Excalidraw ships pre-bundled; prevent Vite from double-processing it
    exclude: [],
  },
  assetsInclude: ['**/*.woff2'],
})
