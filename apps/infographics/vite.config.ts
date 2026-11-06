import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Reads ANTHROPIC_API_KEY for the agentic canvas from the .env file at the repository root.
  envDir: '../..',
  envPrefix: ['VITE_', 'ANTHROPIC_'],
  server: {
    port: 5180,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
})
