import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../.github/skills/kritzel/references/api.md', import.meta.url);
const skillPath = new URL('../.github/skills/kritzel/SKILL.md', import.meta.url);
const packages = [
  { directory: 'engine', tag: 'kritzel-engine' },
  { directory: 'editor', tag: 'kritzel-editor' },
];

function cell(value) {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').replace(/`/g, '\\`').trim();
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
}

const sections = ['# Kritzel component API', '', 'Generated from Stencil docs JSON. For framework bindings, use the matching setup and events references.', ''];
let version;

for (const { directory, tag } of packages) {
  const base = `${root}libs/${directory}/core/`;
  const packageJson = JSON.parse(await readFile(`${base}package.json`, 'utf8'));
  if (version && version !== packageJson.version) {
    throw new Error(`Engine and editor versions differ: ${version} vs ${packageJson.version}`);
  }
  version = packageJson.version;

  let docs;
  try {
    docs = JSON.parse(await readFile(`${base}.stencil/docs.json`, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new Error(`Missing ${directory} Stencil docs JSON; run npm run build -w libs/${directory}/core first.`);
  }
  const component = docs.components.find(item => item.tag === tag);
  if (!component) throw new Error(`Missing ${tag} in ${directory} Stencil docs JSON`);

  sections.push(
    `## <${tag}>`,
    '',
    '### Props',
    '',
    table(['Name', 'Type', 'Required', 'Description'], component.props.map(prop => [prop.name, prop.type, prop.required ? 'yes' : '', prop.docs])),
    '',
    '### Methods',
    '',
    table(['Name', 'Signature', 'Description'], component.methods.map(method => [method.name, method.signature, method.docs])),
    '',
    '### Events',
    '',
    table(['Name', 'Detail', 'Description'], component.events.map(event => [event.event, event.detail, event.docs])),
    '',
  );
}

sections.splice(2, 0, `Source version: @kritzel/engine and @kritzel/editor ${version}.`, '');
const content = `${sections.join('\n')}\n`;
const skill = await readFile(skillPath, 'utf8');
const versionField = /(^  kritzel-version: ')[^']+('(?=\r?$))/m;
if (!versionField.test(skill)) throw new Error('Missing kritzel-version in the skill metadata.');
const updatedSkill = skill.replace(versionField, (_, prefix, suffix) => `${prefix}${version}${suffix}`);

if (process.argv.includes('--check')) {
  const existing = await readFile(output, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return '';
  });
  if (existing !== content) throw new Error('Kritzel skill API is stale; run npm run skill:api after building engine and editor.');
  if (skill !== updatedSkill) throw new Error('Kritzel skill metadata version is stale; run npm run skill:api.');
  console.log('Kritzel skill API is current.');
} else {
  await writeFile(output, content);
  if (skill !== updatedSkill) await writeFile(skillPath, updatedSkill);
  console.log(`Generated Kritzel skill API for ${version}.`);
}