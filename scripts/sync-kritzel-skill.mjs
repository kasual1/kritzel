import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = `${root}.github/skills/kritzel`;
const skill = await readFile(`${source}/SKILL.md`, 'utf8');
if (!/^---\r?\nname: kritzel\r?\n/.test(skill)) throw new Error('Invalid canonical Kritzel skill frontmatter.');
const marker = '.kritzel-generated';
const agents = ['.agents', '.claude'];
const markerPrefix = 'Generated from .github/skills/kritzel\n';

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

for (const agent of agents) {
  const destination = `${root}${agent}/skills/kritzel`;
  const exists = await stat(destination).then(() => true, error => {
    if (error.code !== 'ENOENT') throw error;
    return false;
  });
  if (exists) {
    const generated = await readFile(`${destination}/${marker}`, 'utf8').catch(error => {
      if (error.code !== 'ENOENT') throw error;
      return '';
    });
    const currentFingerprint = await fingerprint(destination);
    if (generated !== `${markerPrefix}${currentFingerprint}\n` && !(generated === markerPrefix && currentFingerprint === sourceFingerprint)) {
      throw new Error(`Refusing to replace existing ${agent}/skills/kritzel; move it aside before syncing.`);
    }
  }
}

for (const agent of agents) {
  const parent = `${root}${agent}/skills`;
  const destination = `${parent}/kritzel`;
  await mkdir(parent, { recursive: true });
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
  const files = await readdir(`${destination}/references`);
  if (!files.includes('api.md')) throw new Error(`Missing generated API in ${destination}; run npm run skill:api first.`);
  await writeFile(`${destination}/${marker}`, `${markerPrefix}${sourceFingerprint}\n`);
  console.log(`Synced Kritzel skill to ${agent}/skills/kritzel`);
}