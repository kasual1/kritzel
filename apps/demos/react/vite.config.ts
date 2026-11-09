import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'dotenv'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * `ANTHROPIC_API_KEY` from the env files at the repository root (`.env`, `.env.local`, `.env.[mode]`,
 * `.env.[mode].local`; later files win), and only from there: never from the shell environment. Values are taken as
 * written (`${OTHER}` is not expanded). Restart the dev server after changing the key.
 */
function readRootApiKey(mode: string): string {
  let value = ''
  for (const file of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    try {
      const parsed = parse(readFileSync(fileURLToPath(new URL(`../../../${file}`, import.meta.url)), 'utf8'))
      if ('ANTHROPIC_API_KEY' in parsed) {
        value = parsed.ANTHROPIC_API_KEY
      }
    } catch {
      // A missing env file is fine.
    }
  }
  return value
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  define: {
    // The TEMP Claude widget page calls the Claude API from the browser with this key. Only the dev server gets it,
    // so a build (e.g. the deployed demos) never contains it.
    'import.meta.env.ANTHROPIC_API_KEY': JSON.stringify(command === 'serve' ? readRootApiKey(mode) : ''),
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
}))
