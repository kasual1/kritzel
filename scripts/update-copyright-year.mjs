// Bumps the end year of the copyright line in every license file to the current year,
// e.g. "Copyright (c) 2025-2026 Lukas Mühlenbeck" -> "Copyright (c) 2025-2027 Lukas Mühlenbeck".
// The build banners (libs/core/build.mjs, libs/*/core/stencil.config.ts) follow the build date on
// their own; this keeps the license files in step with them.
//
// Usage:
//   node scripts/update-copyright-year.mjs           update the files
//   node scripts/update-copyright-year.mjs --check   only report, exit 1 if any file is outdated
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const check = process.argv.includes('--check');
const year = new Date().getFullYear();
const root = resolve(import.meta.dirname, '..');

// Tracked LICENSE / LICENSE.md files anywhere in the repo, plus the website's license page.
const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter(file => /(^|\/)LICENSE[^/]*$/.test(file) || file === 'apps/website/src/pages/license.md');

// First year stays as is; the end year (if any) is replaced by the current year.
const pattern = /Copyright \(c\) (\d{4})(?:-\d{4})? Lukas Mühlenbeck/g;
const years = start => (Number(start) < year ? `${start}-${year}` : start);

let outdated = 0;
for (const file of files) {
  const path = resolve(root, file);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(pattern, (_, start) => `Copyright (c) ${years(start)} Lukas Mühlenbeck`);
  if (after === before) continue;
  outdated++;
  if (check) {
    console.log(`Outdated: ${file}`);
  } else {
    writeFileSync(path, after);
    console.log(`Updated: ${file}`);
  }
}

if (outdated === 0) {
  console.log(`All ${files.length} license files are up to date (${year}).`);
} else if (check) {
  console.error(`${outdated} license file(s) outdated. Run "npm run copyright:update".`);
  process.exit(1);
}
