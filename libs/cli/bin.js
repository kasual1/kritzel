#!/usr/bin/env node
'use strict';

// @kritzel/cli is deprecated. Every command only points to the direct installation below and exits, so
// nobody installs an outdated Kritzel release through it.
const message = `@kritzel/cli is deprecated and no longer installs Kritzel.

Install the editor package for your framework directly instead:

  Angular  npm install @kritzel/angular-editor
  React    npm install @kritzel/react-editor
  Vue      npm install @kritzel/vue-editor

Then follow the quick start for your framework:

  Angular  https://kritzel.io/docs/angular/getting-started/quick-start
  React    https://kritzel.io/docs/react/getting-started/quick-start
  Vue      https://kritzel.io/docs/vue/getting-started/quick-start
`;

const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-V')) {
  console.log(require('./package.json').version);
} else {
  console.error(message);
  // A plain `kritzel --help` is a question, not a failed installation.
  process.exitCode = args.includes('--help') || args.includes('-h') ? 0 : 1;
}
