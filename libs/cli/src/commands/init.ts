import path from 'node:path';
import { readFileSync } from 'node:fs';
import { CliError, CancelledError } from '../shared/errors';
import { InitOptions, ProjectContext, ComponentKind } from '../shared/types';
import { discoverApps, frameworks, exists } from '../project/discover-project';
import { detectManager } from '../project/detect-package-manager';
import { managerVersion, install, installArgs } from '../install/package-manager';
import { resolvePackages } from '../packages/resolve-packages';
import { prepareGeneration, writeGeneration } from '../generation/generate-component';
import { nextSteps } from '../output/next-steps';

function answer<T>(value: T | symbol): T {
  if (typeof value === 'symbol') throw new CancelledError('Cancelled. No further changes will be made.');
  return value;
}

export function cliVersion(): string {
  // The compiled file lives at dist/commands/init.js.
  return (JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')) as { version: string }).version;
}

export async function init(options: InitOptions): Promise<void> {
  if (options.output && !options.generateComponent) throw new CliError('--output requires --generate-component.');
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !options.yes);
  const apps = await discoverApps(options.cwd);
  let app = apps[0];
  if (apps.length > 1) {
    if (!interactive) throw new CliError('Multiple applications found. Use --cwd to target one application.');
    const appDir = answer(await (await import('@clack/prompts')).select({
      message: 'Which application should receive Kritzel?',
      options: apps.map(candidate => ({ value: candidate.appDir, label: `${candidate.manifest.name ?? path.basename(candidate.appDir)} (${path.relative(options.cwd, candidate.appDir)})` })),
    }));
    app = apps.find(candidate => candidate.appDir === appDir)!;
  }
  const candidates = frameworks(app.manifest);
  let framework = options.framework;
  if (framework && !candidates.includes(framework)) throw new CliError(`The selected app does not declare ${framework}. Install its framework manually first.`);
  if (!framework) {
    if (candidates.length === 1) framework = candidates[0];
    else {
      if (!interactive) throw new CliError('Multiple frameworks detected. Specify --framework.');
      framework = answer(await (await import('@clack/prompts')).select({ message: 'Choose the framework', options: candidates.map(value => ({ value, label: value })) }));
    }
  }
  let component: ComponentKind = options.component ?? 'editor';
  if (!options.component && interactive) component = answer(await (await import('@clack/prompts')).select({
    message: 'Editor includes UI and tools; engine is a bare canvas for custom UI.',
    options: [{ value: 'editor', label: 'Editor (recommended)' }, { value: 'engine', label: 'Engine' }],
  }));
  const manager = await detectManager(app, options.packageManager);
  const context: ProjectContext = { ...app, framework, manager, managerVersion: await managerVersion(manager, app.workspaceDir) };
  installArgs(context, []);
  let output = options.output;
  if (options.generateComponent) {
    const deps = { ...app.manifest.devDependencies, ...app.manifest.dependencies };
    if (['next', 'nuxt', '@angular/ssr', 'gatsby', '@remix-run/react', '@sveltejs/kit'].some(name => deps[name])) {
      throw new CliError('Starter generation does not support SSR/meta-framework layouts. Omit --generate-component and integrate Kritzel on the client manually.');
    }
    if (!deps.typescript) throw new CliError('Starter generation requires TypeScript tooling. Install it manually or omit --generate-component.');
    if (!(await exists(path.join(app.appDir, 'tsconfig.json')))) throw new CliError('Starter generation requires an application tsconfig.json.');
    const source = path.join(app.appDir, framework === 'angular' ? 'src/app' : 'src');
    if (!output && !(await exists(source))) {
      if (!interactive) throw new CliError('Unknown source layout. Specify --output for component generation.');
      output = answer(await (await import('@clack/prompts')).text({ message: 'Component directory relative to the application', validate: value => value?.trim() ? undefined : 'Enter a relative directory.' }));
    }
  }
  const generation = options.generateComponent ? await prepareGeneration(context, component, output) : undefined;
  const plan = await resolvePackages(context, component, options.kritzelVersion ?? cliVersion());
  console.log(`Application: ${context.appDir}\nFramework: ${framework}\nIntegration: ${component}\nManager: ${manager} ${context.managerVersion}\nKritzel: ${plan.release}`);
  console.log(plan.specs.length ? `Install: ${plan.specs.join(', ')}` : 'Dependencies are already installed at the selected release.');
  if (plan.reused.length) console.log(`Reuse: ${plan.reused.join(', ')}`);
  if (generation) console.log(`Generate: ${generation.files.map(file => path.relative(app.appDir, file.path)).join(', ')}`);
  if (interactive && !answer(await (await import('@clack/prompts')).confirm({ message: 'Proceed with this installation?', initialValue: true }))) {
    throw new CancelledError('Cancelled before installation. No changes made.');
  }
  await install(context, plan.specs);
  const files = generation ? await writeGeneration(generation) : [];
  console.log('Kritzel dependencies installed/reused successfully. Application source has not been wired automatically.');
  console.log(nextSteps(framework, component, files.map(file => path.relative(app.appDir, file))));
}
