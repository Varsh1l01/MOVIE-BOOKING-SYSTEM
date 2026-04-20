import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When running inside Docker, proxy goes to the backend service name
// When running locally, proxy goes to localhost:5000
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})

