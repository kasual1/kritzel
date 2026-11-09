// TEMP: dev-server proxy for the temp command-mode demo (pages/temp/); delete with it and `proxyConfig` in angular.json.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

/**
 * `ANTHROPIC_API_KEY` from the env files at the repository root (later files win), and only from there: never from
 * the shell environment, so a key exported for other tools isn't used by accident.
 */
function readRootEnv(name) {
  let value = '';
  for (const file of ['.env', '.env.local']) {
    try {
      const parsed = parse(readFileSync(fileURLToPath(new URL(`../../../${file}`, import.meta.url)), 'utf8'));
      if (name in parsed) value = parsed[name];
    } catch {
      // No such file.
    }
  }
  return value;
}

const apiKey = readRootEnv('ANTHROPIC_API_KEY');
if (!apiKey) console.warn('[proxy] ANTHROPIC_API_KEY is not set in the root .env: /temp/command-mode cannot reach the model.');

export default {
  // The demo's mocked server calls the Claude API through here; the key is added on the way, so it never reaches the browser.
  '/temp-anthropic': {
    target: 'https://api.anthropic.com',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/temp-anthropic': '' },
    headers: { 'x-api-key': apiKey },
  },
};
