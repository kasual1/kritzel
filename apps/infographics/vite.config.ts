import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const API_KEY_NAMES = ['ANTHROPIC_API_KEY', 'VITE_ANTHROPIC_API_KEY']

/**
 * The Anthropic API key for the agentic canvas: from the shell, from a .env file in this app,
 * or from the .env file at the repository root, in that order.
 */
function readApiKey(mode: string): string {
  const env = Object.assign(
    {},
    ...['../..', '.'].map(dir => loadEnv(mode, fileURLToPath(new URL(dir, import.meta.url)), API_KEY_NAMES)),
  )
  return API_KEY_NAMES.map(name => env[name]).find(Boolean) ?? ''
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  define: {
    // Only the dev server gets the key, so a production build never contains it.
    __ANTHROPIC_API_KEY__: JSON.stringify(command === 'serve' ? readApiKey(mode) : ''),
  },
  server: {
    port: 5180,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
}))
