import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT) || 4000,
    host: true, // Listen on all addresses
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})
