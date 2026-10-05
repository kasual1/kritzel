import { createRequire } from 'node:module';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import semver from 'semver';
import { ComponentKind, dependencies, PackageMetadata, ProjectContext } from '../shared/types';
import { CliError, hasCode } from '../shared/errors';
import { metadata, run } from '../install/package-manager';
import { exists } from '../project/discover-project';

export function packageNames(context: ProjectContext, component: ComponentKind): string[] {
  return [
    `@kritzel/${context.framework}-${component}`,
    ...(component === 'editor' ? ['@kritzel/editor'] : []),
    '@kritzel/engine',
  ];
}

export type MetadataReader = (context: ProjectContext, spec: string) => Promise<PackageMetadata[]>;
export type InstalledReader = (context: ProjectContext, name: string) => Promise<string | undefined>;

export async function installedVersion(context: ProjectContext, name: string): Promise<string | undefined> {
  if (context.manager === 'yarn' && semver.major(context.managerVersion) >= 2 &&
      (await exists(path.join(context.workspaceDir, '.pnp.cjs')) || await exists(path.join(context.workspaceDir, '.pnp.js')))) {
    const script = `const fs=require('fs'),path=require('path'),r=require('module').createRequire(path.join(process.argv[1],'package.json'));let p;try{p=r.resolve(process.argv[2])}catch(e){if(e.code==='MODULE_NOT_FOUND')process.exit(0);throw e}for(let d=path.dirname(p);;d=path.dirname(d)){const f=path.join(d,'package.json');if(fs.existsSync(f)){const m=JSON.parse(fs.readFileSync(f,'utf8'));if(m.name===process.argv[2]){console.log(m.version);break}}if(d===path.dirname(d))throw Error('Cannot locate installed manifest')}`;
    const output = await run('yarn', ['node', '-e', script, context.appDir, name], context.workspaceDir);
    return output || undefined;
  }
  const require = createRequire(path.join(context.appDir, 'package.json'));
  let entry: string;
  try { entry = require.resolve(name); }
  catch (error) {
    if (hasCode(error, 'MODULE_NOT_FOUND')) return undefined;
    throw error;
  }
  let dir = path.dirname(entry);
  while (true) {
    try {
      const value: unknown = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
      if (value && typeof value === 'object' && 'name' in value && value.name === name &&
          'version' in value && typeof value.version === 'string') return value.version;
    } catch (error) {
      if (!hasCode(error, 'ENOENT')) throw error;
    }
    if (dir === path.dirname(dir)) throw new CliError(`Cannot locate installed metadata for ${name}.`);
    dir = path.dirname(dir);
  }
}

function satisfiesDeclaration(declared: string, version: string): boolean {
  return Boolean(semver.validRange(declared) && semver.satisfies(version, declared));
}

export interface InstallPlan { specs: string[]; reused: string[]; release: string }

export async function resolvePackages(
  context: ProjectContext,
  component: ComponentKind,
  release: string,
  readMetadata: MetadataReader = metadata,
  readInstalled: InstalledReader = installedVersion,
): Promise<InstallPlan> {
  if (semver.valid(release) !== release || semver.prerelease(release)) throw new CliError('--kritzel-version must be an exact stable semantic version.');
  const deps = dependencies(context.manifest);
  const names = packageNames(context, component);
  const wrappers = Object.keys(deps).filter(name => /^@kritzel\/(angular|react|vue)-(engine|editor)$/.test(name));
  if (wrappers.some(name => !names.includes(name))) throw new CliError('A different Kritzel wrapper is already declared. Align/remove that integration manually before running init.');
  const packages = await Promise.all(names.map(async name => {
    const entries = await readMetadata(context, `${name}@${release}`);
    const entry = entries.find(value => value.name === name && value.version === release);
    if (!entry) throw new CliError(`${name}@${release} is not available. All Kritzel packages must exist at the same release.`);
    return entry;
  }));
  const peers = new Map<string, string[]>();
  for (const entry of packages) {
    for (const [name, range] of Object.entries(entry.peerDependencies ?? {})) {
      if (entry.peerDependenciesMeta?.[name]?.optional) continue;
      if (!semver.validRange(range)) throw new CliError(`Unsupported peer range ${name}@${range}.`);
      if (name.startsWith('@kritzel/')) {
        if (!names.includes(name) || !semver.satisfies(release, range)) throw new CliError(`Incompatible Kritzel release: ${entry.name} requires ${name}@${range}.`);
      } else peers.set(name, [...(peers.get(name) ?? []), range]);
    }
  }
  const frameworkPeers: Record<string, string> = context.framework === 'angular'
    ? { '@angular/core': '>=19 <23', '@angular/common': '>=19 <23' }
    : context.framework === 'react' ? { react: '>=18 <20', 'react-dom': '>=18 <20' } : { vue: '>=3.5 <4' };
  for (const [name, range] of Object.entries(frameworkPeers)) peers.set(name, [...(peers.get(name) ?? []), range]);
  const allowedMissing = new Set(['yjs', 'lib0', 'y-indexeddb', 'y-websocket']);
  const selected = new Map(packages.map(entry => [entry.name, entry.version]));
  const reused: string[] = [];
  for (const [name, ranges] of peers) {
    if (deps[name]) {
      const resolved = await readInstalled(context, name);
      const installed = resolved && satisfiesDeclaration(deps[name], resolved) ? resolved : undefined;
      const declaredRange = semver.validRange(deps[name]);
      const rangeCovered = declaredRange && ranges.every(range => semver.subset(declaredRange, range));
      if (!rangeCovered || (resolved && !ranges.every(range => semver.satisfies(resolved, range)))) {
        throw new CliError(`Incompatible ${name}: declared ${deps[name]}${installed ? `, installed ${installed}` : ''}; required ${ranges.join(' and ')}. Align it manually; the CLI will not upgrade frameworks or peers.`);
      }
      if (installed) {
        if (allowedMissing.has(name) && !context.manifest.dependencies?.[name]) selected.set(name, installed);
        else reused.push(`${name}@${installed}`);
        continue;
      }
      const entries = await readMetadata(context, `${name}@${deps[name]}`);
      const matching = entries.filter(entry => entry.name === name && ranges.every(range => semver.satisfies(entry.version, range)));
      const latest = matching.sort((a, b) => semver.rcompare(a.version, b.version))[0];
      if (!latest) throw new CliError(`No compatible published ${name} for ${deps[name]}.`);
      selected.set(name, latest.version);
    } else {
      if (!allowedMissing.has(name)) throw new CliError(`Required peer ${name}@${ranges.join(' and ')} is missing. Install it manually before running init.`);
      const entries = await readMetadata(context, `${name}@${ranges.join(' ')}`);
      const matching = entries.filter(entry => entry.name === name && ranges.every(range => semver.satisfies(entry.version, range)));
      const latest = matching.sort((a, b) => semver.rcompare(a.version, b.version))[0];
      if (!latest) throw new CliError(`No compatible published version of ${name}.`);
      selected.set(name, latest.version);
    }
  }
  const specs: string[] = [];
  for (const [name, version] of selected) {
    if (deps[name] && !satisfiesDeclaration(deps[name], version)) {
      throw new CliError(`${name} is declared as ${deps[name]}, incompatible with ${version}. Align existing dependencies manually.`);
    }
    const installed = await readInstalled(context, name);
    if (installed && installed !== version && name.startsWith('@kritzel/')) throw new CliError(`${name}@${installed} is installed; expected ${version}. Align the installed Kritzel release manually.`);
    if (context.manifest.dependencies?.[name] && installed === version) reused.push(`${name}@${version}`);
    else specs.push(`${name}@${version}`);
  }
  return { specs, reused, release };
}
