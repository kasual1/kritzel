import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Reads ANTHROPIC_API_KEY for the generative UI from the .env file at the repository root.
  envDir: '../..',
  // Vite only hands VITE_* variables to the page; this also lets ANTHROPIC_API_KEY through, and nothing else of it.
  envPrefix: ['VITE_', 'ANTHROPIC_API_KEY'],
  server: {
    port: 5180,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
})
