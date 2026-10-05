import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { parse } from 'yaml';
import { CliError, hasCode } from '../shared/errors';
import { dependencies, Framework, Manifest } from '../shared/types';

export async function exists(file: string): Promise<boolean> {
  try { await stat(file); return true; }
  catch (error) {
    if (hasCode(error, 'ENOENT')) return false;
    throw error;
  }
}

export async function readManifest(dir: string): Promise<Manifest> {
  const file = path.join(dir, 'package.json');
  try {
    const value: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object.');
    const manifest = value as Manifest;
    for (const field of ['dependencies', 'devDependencies'] as const) {
      const values = manifest[field];
      if (values !== undefined && (typeof values !== 'object' || values === null || Array.isArray(values) ||
          Object.values(values).some(entry => typeof entry !== 'string'))) {
        throw new Error(`Invalid ${field}.`);
      }
    }
    if (manifest.name !== undefined && (typeof manifest.name !== 'string' ||
        !/^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(manifest.name))) throw new Error('Invalid package name.');
    if (manifest.packageManager !== undefined && typeof manifest.packageManager !== 'string') throw new Error('Invalid packageManager.');
    return manifest;
  } catch (error) {
    throw new CliError(`Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function frameworks(manifest: Manifest): Framework[] {
  const deps = dependencies(manifest);
  return (['angular', 'react', 'vue'] as const).filter(framework =>
    Boolean(deps[framework === 'angular' ? '@angular/core' : framework]));
}

async function workspaceMembers(dir: string, manifest: Manifest): Promise<string[] | undefined> {
  let patterns: unknown = Array.isArray(manifest.workspaces) ? manifest.workspaces : manifest.workspaces?.packages;
  const pnpm = path.join(dir, 'pnpm-workspace.yaml');
  if (await exists(pnpm)) {
    const parsed: unknown = parse(await readFile(pnpm, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || !('packages' in parsed)) throw new CliError(`Invalid workspace packages in ${pnpm}.`);
    patterns = parsed.packages;
  }
  if (patterns === undefined) {
    if (manifest.workspaces !== undefined) throw new CliError(`Invalid workspaces in ${dir}.`);
    return undefined;
  }
  if (!Array.isArray(patterns) || patterns.some(item => typeof item !== 'string')) {
    throw new CliError(`Workspace packages must be an array of globs in ${dir}.`);
  }
  if (patterns.some((item: string) => path.isAbsolute(item.replace(/^!/, '')) || item.split(/[\\/]/).includes('..'))) {
    throw new CliError(`Workspace patterns must stay inside ${dir}.`);
  }
  const dirs = await fg(patterns as string[], {
    cwd: dir, onlyDirectories: true, absolute: true, unique: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/build/**'],
    followSymbolicLinks: false,
  });
  const members: string[] = [];
  const names = new Set<string>();
  for (const candidate of dirs.sort()) {
    if (await exists(path.join(candidate, 'package.json'))) {
      const member = await readManifest(candidate);
      if (member.name && names.has(member.name)) throw new CliError(`Duplicate workspace package name ${member.name}. Targeted installation would be ambiguous.`);
      if (member.name) names.add(member.name);
      members.push(path.resolve(candidate));
    }
  }
  return members;
}

export interface DiscoveredApp { appDir: string; workspaceDir: string; manifest: Manifest }

export async function discoverApps(start: string): Promise<DiscoveredApp[]> {
  let dir = path.resolve(start);
  if (!(await exists(dir)) || !(await stat(dir)).isDirectory()) throw new CliError(`Not an existing directory: ${dir}`);
  while (!(await exists(path.join(dir, 'package.json')))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new CliError('No package.json found. Run init inside an existing application.');
    dir = parent;
  }
  const manifest = await readManifest(dir);
  const members = await workspaceMembers(dir, manifest);
  if (members) {
    const apps: DiscoveredApp[] = [];
    for (const member of members) {
      const candidate = await readManifest(member);
      if (frameworks(candidate).length) apps.push({ appDir: member, workspaceDir: dir, manifest: candidate });
    }
    if (!apps.length) throw new CliError(`No Angular, React or Vue application found in ${dir}.`);
    return apps;
  }
  if (!frameworks(manifest).length) throw new CliError(`No supported framework in ${dir}. Install the framework before running init.`);
  let workspaceDir = dir;
  let parent = path.dirname(dir);
  while (parent !== path.dirname(parent)) {
    if (await exists(path.join(parent, 'package.json'))) {
      const owner = await readManifest(parent);
      const candidates = await workspaceMembers(parent, owner);
      if (candidates?.includes(dir)) { workspaceDir = parent; break; }
    }
    parent = path.dirname(parent);
  }
  return [{ appDir: dir, workspaceDir, manifest }];
}
