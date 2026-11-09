/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** From the `.env` file at the repository root; only the dev server sets it (see `vite.config.ts`). */
  readonly ANTHROPIC_API_KEY?: string;
}
