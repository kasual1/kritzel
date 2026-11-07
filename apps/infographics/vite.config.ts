import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'dotenv'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** The env files at the repository root, in Vite's order: later files override earlier ones. */
function rootEnvFiles(mode: string): string[] {
  return ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`].map(file => fileURLToPath(new URL(`../../${file}`, import.meta.url)))
}

/**
 * Reads one variable from the env files at the repository root, and only from there: never from the shell
 * environment, so a key exported for other tools doesn't end up in the browser bundle by accident.
 */
function readRootEnv(files: string[], name: string): string {
  let value = ''
  for (const file of files) {
    let text: string
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const parsed = parse(text)
    if (name in parsed) {
      value = parsed[name]
    }
  }
  return value
}

/** Restarts the dev server when a root env file changes, so a new key is picked up. */
function restartOnEnvChange(files: string[]): Plugin {
  return {
    name: 'restart-on-root-env-change',
    configureServer(server) {
      server.watcher.add(files)
      const restart = (file: string) => {
        if (files.includes(file)) {
          void server.restart()
        }
      }
      server.watcher.on('add', restart)
      server.watcher.on('change', restart)
      server.watcher.on('unlink', restart)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envFiles = rootEnvFiles(mode)
  return {
    plugins: [react(), restartOnEnvChange(envFiles)],
    define: {
      // The agentic canvas calls the Claude API from the browser with this key: only run it locally.
      'import.meta.env.ANTHROPIC_API_KEY': JSON.stringify(readRootEnv(envFiles, 'ANTHROPIC_API_KEY')),
    },
    server: {
      port: 5180,
    },
    build: {
      chunkSizeWarningLimit: 5000,
    },
  }
})
