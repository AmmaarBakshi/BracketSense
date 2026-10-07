import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { studentAssets } from './build/studentAssets.ts'

// Relative base + HashRouter: the built app works from any folder or sub-path
// (GitHub Pages, a USB stick, `npm run preview`) with no server config.
export default defineConfig({
  base: './',
  plugins: [react(), studentAssets()],
  build: {
    // Keep compiled chunks out of assets/, which belongs to the student's pictures.
    assetsDir: 'static',
    chunkSizeWarningLimit: 900,
  },
})
