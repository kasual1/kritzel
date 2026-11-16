import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = `${root}.github/skills/upmade`;
const skill = await readFile(`${source}/SKILL.md`, 'utf8');
if (!/^---\r?\nname: upmade\r?\n/.test(skill)) throw new Error('Invalid canonical Upmade skill frontmatter.');
const marker = '.upmade-generated';
const agents = ['.agents', '.claude'];
const markerPrefix = 'Generated from .github/skills/upmade\n';

async function fingerprint(directory) {
  const hash = createHash('sha256');
  async function visit(path, relative = '') {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((first, second) => first.name.localeCompare(second.name))) {
      if (entry.name === marker) continue;
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(`${path}/${entry.name}`, name);
      else {
        hash.update(name);
        hash.update(await readFile(`${path}/${entry.name}`));
      }
    }
  }
  await visit(directory);
  return hash.digest('hex');
}

const sourceFingerprint = await fingerprint(source);

// Copies synced before the renames live under the old skill names (Updraw, and Kritzel before it), each with its
// own marker. Remove them when this script generated them, so agents do not load an outdated skill next to the
// current one. Copies without a marker (e.g. installed with `npx skills add`) are only reported.
const legacySkills = ['updraw', 'kritzel'];
const exists = path => stat(path).then(() => true, error => {
  if (error.code !== 'ENOENT') throw error;
  return false;
});
for (const legacySkill of legacySkills) {
  for (const agent of agents) {
    const legacyDestination = `${root}${agent}/skills/${legacySkill}`;
    if (await exists(`${legacyDestination}/.${legacySkill}-generated`)) {
      await rm(legacyDestination, { recursive: true, force: true });
      console.log(`Removed outdated ${agent}/skills/${legacySkill}`);
    } else if (await exists(legacyDestination)) {
      console.warn(`Left ${agent}/skills/${legacySkill} in place (not generated here); remove it if it is an old copy of this skill.`);
    }
  }
}

for (const agent of agents) {
  const destination = `${root}${agent}/skills/upmade`;
  if (await exists(destination)) {
    const generated = await readFile(`${destination}/${marker}`, 'utf8').catch(error => {
      if (error.code !== 'ENOENT') throw error;
      return '';
    });
    const currentFingerprint = await fingerprint(destination);
    if (generated !== `${markerPrefix}${currentFingerprint}\n` && !(generated === markerPrefix && currentFingerprint === sourceFingerprint)) {
      throw new Error(`Refusing to replace existing ${agent}/skills/upmade; move it aside before syncing.`);
    }
  }
}

for (const agent of agents) {
  const parent = `${root}${agent}/skills`;
  const destination = `${parent}/upmade`;
  await mkdir(parent, { recursive: true });
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
  const files = await readdir(`${destination}/references`);
  if (!files.includes('api.md')) throw new Error(`Missing generated API in ${destination}; run npm run skill:api first.`);
  await writeFile(`${destination}/${marker}`, `${markerPrefix}${sourceFingerprint}\n`);
  console.log(`Synced Upmade skill to ${agent}/skills/upmade`);
}