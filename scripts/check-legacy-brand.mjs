#!/usr/bin/env node
// Guards the rename from Kritzel to Updraw: fails when a tracked path contains the old name, or when a
// tracked file mentions it anywhere the allowlist below does not expect it. Legacy names are kept on
// purpose only to read data saved before the rename, for external resources that were not renamed
// (the GitHub repository and social accounts) and in migration documentation.
import { execFileSync } from 'node:child_process';

/**
 * Allowed occurrences. `file` is matched against the repository-relative path (string = exact path,
 * RegExp = pattern). `line`, when given, must match every line of that file that contains the old name.
 */
const ALLOWED = [
  // External resources that keep their name: the GitHub repository (incl. Pages) and social accounts.
  { file: /./, line: /kasual1\/kritzel\b|kasual1\.github\.io\/kritzel\b|x\.com\/kritzel_io\b|kritzelio\.bsky\.social|linkedin\.com\/in\/kritzel-app-26721b40b|projectName: "kritzel"/ },
  // Guard against leaking the name of a private repository that is not renamed.
  { file: 'apps/website/tests/llms-output.spec.ts', line: /kritzel-private/ },
  // Dead one-off script with a local clone path named after the repository.
  { file: 'copy_methods.js', line: /Projects\/kritzel\b/ },

  // Library compatibility with data saved before the rename.
  { file: 'libs/core/src/migrations/legacy-brand.ts' },
  { file: 'libs/core/src/migrations/legacy-brand.spec.ts' },
  { file: 'libs/core/src/migrations/legacy-indexeddb.spec.ts' },
  { file: /^libs\/core\/src\/__fixtures__\// },
  { file: /^libs\/core\/src\/migrations\/workspace\.migrations(\.spec)?\.ts$/, line: /'Kritzel[A-Za-z]*'|`Kritzel[A-Za-z]*`/ },
  { file: 'libs/core/src/classes/core/core.class.spec.ts', line: /'kritzel-workspace-/ },
  { file: 'libs/core/src/classes/tools/base-tool.class.spec.ts', line: /'KritzelBrushTool'/ },
  { file: 'libs/core/src/classes/managers/clipboard.manager.spec.ts', line: /kritzel-clipboard\/v1:|'KritzelShape'/ },
  { file: 'libs/core/src/classes/objects/iframe.class.spec.ts', line: /kritzel/i },
  { file: 'libs/engine/core/src/components/updraw-engine/updraw-engine.spec.ts', line: /'Kritzel(Workspace|Image|Path)'/ },
  { file: 'libs/engine/core/src/components/updraw-engine/updraw-engine.css', line: /--kritzel-content-border-radius/ },

  // Server: renames documents saved under the old names and rejects stale clients.
  { file: /^apps\/app\/server\/api\/src\/migrations\/\d+-RenameLegacyBrandDocumentIds(\.spec)?\.ts$/ },
  { file: /^apps\/app\/server\/websocket\/src\/legacy-brand(\.spec)?\.ts$/ },

  // Migration documentation: the cutover runbook and the migration guides.
  { file: 'apps/app/docs/rebrand-cutover.md' },
  { file: /^apps\/website\/docs\/(angular|react|vue)\/getting-started\/migrating-to-updraw\.md$/ },
  { file: '.github/workflows/deploy-app.yml', line: /kritzel-app/ },

  // Old public URLs that redirect to the new ones, and the test that checks them.
  { file: 'apps/website/static/_redirects', line: /^\/\S*kritzel\S*\s/i },
  { file: 'apps/website/tests/redirects.spec.ts', line: /kritzel/i },

  // Locally synced skill copies made before the rename.
  { file: '.gitignore', line: /^\.(agents|claude)\/skills\/kritzel\/$/ },
  { file: 'scripts/sync-updraw-skill.mjs', line: /const legacySkill = 'kritzel';/ },

  // This script.
  { file: 'scripts/check-legacy-brand.mjs' },
];

const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });

const isAllowed = (file, line) =>
  ALLOWED.some(rule => (typeof rule.file === 'string' ? rule.file === file : rule.file.test(file)) && (!rule.line || rule.line.test(line)));

const problems = [];

for (const file of git(['ls-files', '-z']).split('\0').filter(Boolean)) {
  if (/kritzel/i.test(file)) problems.push(`${file}: path contains the old name`);
}

let matches = '';
try {
  // -I skips binary files; binaries are checked separately below.
  matches = git(['grep', '-n', '-I', '-i', '--null', 'kritzel']);
} catch (error) {
  if (error.status !== 1) throw error; // 1 = no matches
}
for (const entry of matches.split('\n').filter(Boolean)) {
  const [file, lineNumber, ...rest] = entry.split('\0');
  const line = rest.join('\0');
  if (!isAllowed(file, line)) problems.push(`${file}:${lineNumber}: ${line.trim().slice(0, 160)}`);
}

let binaries = '';
try {
  binaries = git(['grep', '-l', '-i', '-a', 'kritzel', '--', ...git(['ls-files']).split('\n').filter(f => /\.(png|jpe?g|gif|webp|ico|mp4|webm|woff2?|ttf|otf|pdf)$/i.test(f))]);
} catch (error) {
  if (error.status !== 1) throw error;
}
for (const file of binaries.split('\n').filter(Boolean)) {
  if (!isAllowed(file, '')) problems.push(`${file}: binary file contains the old name`);
}

if (problems.length) {
  console.error(`Found ${problems.length} unexpected occurrence(s) of the old name "Kritzel":`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('Use the new name, or add an entry to ALLOWED in scripts/check-legacy-brand.mjs if the old name is required.');
  process.exit(1);
}
console.log('No unexpected occurrences of the old name.');
