import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockChatServer } from './src/pages/temp/mock-chat-server' // TEMP: delete with src/pages/temp/

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockChatServer()],
  build: {
    chunkSizeWarningLimit: 5000,
  },
})
