// Removes the rxjs-based proxyOutputs helper from Stencil's generated Angular utils.
// Usage: node strip-angular-rxjs-output.mjs <path/to/utils.ts> [...more]
// Paths are resolved relative to the current working directory (the calling package).
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const generatedFiles = process.argv.slice(2);
const rxjsImport = /^import \{ fromEvent \} from 'rxjs';\r?\n/m;
const proxyOutputs = /^export const proxyOutputs = \(instance: any, el: any, events: string\[\]\) => \{\r?\n  events\.forEach\(\(eventName\) => \(instance\[eventName\] = fromEvent\(el, eventName\)\)\);\r?\n\};\r?\n?/m;

if (generatedFiles.length === 0) {
  throw new Error('Usage: strip-angular-rxjs-output.mjs <generated utils.ts>...');
}

for (const relativePath of generatedFiles) {
  const filePath = path.resolve(relativePath);
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
