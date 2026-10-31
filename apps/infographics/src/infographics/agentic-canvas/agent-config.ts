/**
 * Your Anthropic API key, from https://platform.claude.com/settings/keys.
 *
 * Paste it here, or put `VITE_ANTHROPIC_API_KEY=...` into `apps/infographics/.env.local` to keep it out of git.
 * The showcase calls the Claude API straight from the browser, so the key is readable by anyone who
 * opens the page: only use it locally. A real app would send the requests through its own backend.
 */
const API_KEY = '';

export const ANTHROPIC_API_KEY: string = API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY || '';

export const CLAUDE_MODEL = 'claude-opus-5-5';

/** How much Claude thinks before it acts. `low` is snappier, `high` builds more polished pages. */
export const CLAUDE_EFFORT = 'medium';
