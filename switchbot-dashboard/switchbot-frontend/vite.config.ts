import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Assets are served from the FastAPI static mount at the site root.
  base: '/',
  server: {
    port: 5173,
  },
})
