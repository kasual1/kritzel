import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedFiles = [
  'libs/editor/angular/projects/lib/src/lib/angular-component-lib/utils.ts',
  'libs/engine/angular/projects/lib/src/lib/angular-component-lib/utils.ts',
];
const rxjsImport = /^import \{ fromEvent \} from 'rxjs';\r?\n/m;
const proxyOutputs = /^export const proxyOutputs = \(instance: any, el: any, events: string\[\]\) => \{\r?\n  events\.forEach\(\(eventName\) => \(instance\[eventName\] = fromEvent\(el, eventName\)\)\);\r?\n\};\r?\n?/m;

for (const relativePath of generatedFiles) {
  const filePath = path.join(repositoryRoot, relativePath);
  const source = await readFile(filePath, 'utf8');
  const hasImport = rxjsImport.test(source);
  const hasHelper = proxyOutputs.test(source);

  if (!hasImport && !hasHelper) {
    continue;
  }

  if (!hasImport || !hasHelper) {
    throw new Error(`Unexpected generated Angular helper in ${relativePath}`);
  }

  const cleanedSource = source.replace(rxjsImport, '').replace(proxyOutputs, '');
  await writeFile(filePath, cleanedSource);
}
