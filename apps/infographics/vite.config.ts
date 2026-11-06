import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Reads one variable from the .env file at the repository root, and only from there: never from the shell
 * environment, so a key exported for other tools doesn't end up in the browser bundle by accident.
 */
function readRootEnv(name: string): string {
  let text: string
  try {
    text = readFileSync(fileURLToPath(new URL('../../.env', import.meta.url)), 'utf8')
  } catch {
    return ''
  }
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (match && match[1] === name) {
      return match[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
  return ''
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // The agentic canvas calls the Claude API from the browser with this key: only run it locally.
    'import.meta.env.ANTHROPIC_API_KEY': JSON.stringify(readRootEnv('ANTHROPIC_API_KEY')),
  },
  server: {
    port: 5180,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
})
