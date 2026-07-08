import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Alias '@' → ./src, para imports limpios como '@/components/ui/button'
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Fijamos host y puerto para que la URL coincida EXACTO con la
    // Redirect URI registrada en Spotify (http://127.0.0.1:5173/callback).
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Las llamadas del front a /api se reenvían al backend Express (3001).
    // Así no hay problemas de CORS: para el navegador es el mismo origen.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
