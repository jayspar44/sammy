import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read version from package.json
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

// Get backend port from environment or calculate it
const frontendPort = parseInt(process.env.PORT) || 4000;
const backendPort = parseInt(process.env.BACKEND_PORT) || (frontendPort + 1);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    '__APP_VERSION__': JSON.stringify(pkg.version),
  },
  server: {
    port: frontendPort,
    host: '0.0.0.0', // Explicitly bind to all interfaces
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})
