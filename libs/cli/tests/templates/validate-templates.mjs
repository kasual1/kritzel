import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseTemplate } from '@angular/compiler';
import ts from 'typescript';
import { compileScript, compileTemplate, parse as parseVue } from '@vue/compiler-sfc';
import spawn from 'cross-spawn';
import { runBrowserSmoke } from './browser-smoke.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, '../..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const validationRoot = path.join(packageRoot, '.validation');
await mkdir(validationRoot, { recursive: true });
const temporaryDirectory = await mkdtemp(path.join(validationRoot, 'templates-'));
const require = createRequire(import.meta.url);

function run(command, args, cwd) {
  const result = spawn.sync(command, args, { cwd, encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.error || result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function diagnosticsText(diagnostics) {
  return diagnostics.map(diagnostic => {
    const location = diagnostic.file && diagnostic.start !== undefined
      ? `${diagnostic.file.fileName}:${diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1}: `
      : '';
    return `${location}${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`;
  }).join('\n');
}

function checkErrors(errors, label) {
  if (errors.length) throw new Error(`${label} failed:\n${errors.join('\n')}`);
}

function normalizePackResult(result) {
  if (Array.isArray(result)) return result[0];
  if (result && typeof result === 'object' && 'filename' in result) return result;
  if (result && typeof result === 'object') return Object.values(result)[0];
  return undefined;
}

function verifyPackResultFormats() {
  const metadata = { filename: 'kritzel.tgz' };
  assert.equal(normalizePackResult([metadata]), metadata, 'npm array pack output should be supported');
  assert.equal(normalizePackResult({ '@kritzel/cli': metadata }), metadata, 'npm keyed pack output should be supported');
  assert.equal(normalizePackResult(metadata), metadata, 'direct pack metadata should be supported');
}

async function packDependency(name, relativeDirectory) {
  const packageDirectory = path.join(repositoryRoot, relativeDirectory);
  const packedResult = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', temporaryDirectory], packageDirectory));
  const packed = normalizePackResult(packedResult);
  if (!packed?.filename) throw new Error(`npm pack returned no tarball metadata for ${name}.`);
  const archive = path.join(temporaryDirectory, packed.filename);
  const stagingDirectory = path.join(temporaryDirectory, 'unpacked', name);
  await mkdir(stagingDirectory, { recursive: true });
  execFileSync('tar', ['-xzf', archive, '-C', stagingDirectory], { stdio: 'pipe' });

  const targetDirectory = name.startsWith('@')
    ? path.join(temporaryDirectory, 'node_modules', ...name.split('/'))
    : path.join(temporaryDirectory, 'node_modules', '@kritzel', name);
  await mkdir(path.dirname(targetDirectory), { recursive: true });
  await rename(path.join(stagingDirectory, 'package'), targetDirectory);
  const manifest = JSON.parse(await readFile(path.join(targetDirectory, 'package.json'), 'utf8'));
  const declarationPath = manifest.types ?? manifest.typings;
  if (!name.startsWith('@stencil/')) {
    assert(declarationPath, `${name} package does not declare TypeScript declarations`);
    await readFile(path.join(targetDirectory, ...declarationPath.split('/')));
  }
  return targetDirectory;
}

async function compileCliGenerator(buildDirectory) {
  const configPath = path.join(packageRoot, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(diagnosticsText([config.error]));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot, {
    noEmit: false,
    outDir: buildDirectory,
    declaration: false,
    sourceMap: false,
    incremental: false,
  }, configPath);
  const srcDirectory = path.join(packageRoot, 'src');
  const rootNames = [
    path.join(srcDirectory, 'generation/generate-component.ts'),
    path.join(srcDirectory, 'shared/errors.ts'),
    path.join(srcDirectory, 'shared/types.ts'),
  ];
  const program = ts.createProgram(rootNames, {
    ...parsed.options,
    rootDir: srcDirectory,
    outDir: buildDirectory,
    noEmit: false,
    declaration: false,
    sourceMap: false,
    incremental: false,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(`CLI generator typecheck failed:\n${diagnosticsText(diagnostics)}`);
  const emitted = program.emit();
  if (emitted.emitSkipped || emitted.diagnostics.length) {
    throw new Error(`CLI generator compilation failed:\n${diagnosticsText(emitted.diagnostics)}`);
  }
}

function typecheckGeneratedFiles(sourceFiles) {
  const program = ts.createProgram(sourceFiles, {
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    experimentalDecorators: true,
    types: ['node'],
    noEmit: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(`Generated template typecheck failed:\n${diagnosticsText(diagnostics)}`);
}

async function main() {
  verifyPackResultFormats();
  const engineManifest = JSON.parse(await readFile(path.join(repositoryRoot, 'libs/engine/core/package.json'), 'utf8'));
  const release = engineManifest.version;
  if (typeof release !== 'string' || release.length === 0) {
    throw new Error('The engine package manifest does not declare a release version.');
  }
  const vuePackageRequire = createRequire(path.join(repositoryRoot, 'libs/engine/vue/package.json'));
  const vueRuntimePackage = path.resolve(path.dirname(vuePackageRequire.resolve('@stencil/vue-output-target/runtime')), '..');
  const packages = [
    ['engine', 'libs/engine/core'],
    ['editor', 'libs/editor/core'],
    ['angular-engine', 'libs/engine/angular/dist/lib'],
    ['react-engine', 'libs/engine/react'],
    ['vue-engine', 'libs/engine/vue'],
    ['angular-editor', 'libs/editor/angular/dist/lib'],
    ['react-editor', 'libs/editor/react'],
    ['vue-editor', 'libs/editor/vue'],
    ['@stencil/vue-output-target', path.relative(repositoryRoot, vueRuntimePackage)],
  ];
  for (const [name, directory] of packages) await packDependency(name, directory);

  const buildDirectory = path.join(temporaryDirectory, 'cli-build');
  await compileCliGenerator(buildDirectory);
  const { prepareGeneration, writeGeneration } = require(path.join(buildDirectory, 'generation', 'generate-component.js'));
  const contexts = [];
  const generatedSources = [];
  const combinations = [
    ['angular', 'editor'],
    ['angular', 'engine'],
    ['react', 'editor'],
    ['react', 'engine'],
    ['vue', 'editor'],
    ['vue', 'engine'],
  ];

  for (const [framework, component] of combinations) {
    const appDirectory = path.join(temporaryDirectory, 'apps', `${framework}-${component}`);
    const sourceDirectory = framework === 'angular' ? 'src/app' : 'src/components';
    await mkdir(path.join(appDirectory, sourceDirectory), { recursive: true });
    const context = {
      appDir: appDirectory,
      workspaceDir: appDirectory,
      manifest: {
        name: `template-${framework}-${component}`,
        dependencies: {
          '@kritzel/engine': `^${release}`,
          ...(component === 'editor' ? { '@kritzel/editor': `^${release}` } : {}),
          [`@kritzel/${framework}-${component}`]: `^${release}`,
        },
      },
      framework,
      manager: 'npm',
      managerVersion: '10.0.0',
    };
    const plan = await prepareGeneration(context, component);
    const writtenFiles = await writeGeneration(plan);
    const generated = writtenFiles.map(file => path.join(appDirectory, ...file.split('/')));

    for (const file of generated.filter(candidate => candidate.endsWith('.html'))) {
      const template = parseTemplate(await readFile(file, 'utf8'), file);
      checkErrors((template.errors ?? []).map(String), file);
    }

    if (framework === 'vue') {
      const file = generated.find(candidate => candidate.endsWith('.vue'));
      assert(file, `${framework} ${component} template file was not generated`);
      const source = await readFile(file, 'utf8');
      const parsed = parseVue(source, { filename: file });
      checkErrors(parsed.errors.map(String), file);
      assert(parsed.descriptor.scriptSetup, `${file} is missing <script setup lang="ts">`);
      const script = compileScript(parsed.descriptor, { id: `${framework}-${component}` });
      const template = compileTemplate({
        source: parsed.descriptor.template?.content ?? '',
        filename: file,
        id: `${framework}-${component}`,
        compilerOptions: { bindingMetadata: script.bindings },
      });
      checkErrors(template.errors.map(String), file);
      const typecheckFile = `${file}.ts`;
      await writeFile(typecheckFile, script.content, 'utf8');
      generatedSources.push(typecheckFile);
    } else {
      generatedSources.push(...generated.filter(file => /\.(tsx?|ts)$/.test(file)));
    }
    contexts.push({ framework, component, files: generated });
  }

  typecheckGeneratedFiles(generatedSources);
  console.log(`Validated ${contexts.length} generated starters against packed Kritzel ${release} packages: Angular, React and Vue editor/engine templates compile.`);
  await runBrowserSmoke(contexts, temporaryDirectory);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
