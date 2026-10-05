import path from 'node:path';
import semver from 'semver';
import { CliError } from '../shared/errors';
import { PackageManager } from '../shared/types';
import { DiscoveredApp, exists, readManifest } from './discover-project';

export async function detectManager(app: DiscoveredApp, explicit?: PackageManager): Promise<PackageManager> {
  const signals = new Set<PackageManager>();
  for (const dir of new Set([app.appDir, app.workspaceDir])) {
    const manifest = dir === app.appDir ? app.manifest : await readManifest(dir);
    if (manifest.packageManager) {
      const match = /^(npm|pnpm|yarn)@(.+)$/.exec(manifest.packageManager);
      if (!match) throw new CliError(`Unsupported packageManager declaration in ${dir}: ${manifest.packageManager}`);
      signals.add(match[1] as PackageManager);
    }
    for (const [manager, lock] of [
      ['npm', 'package-lock.json'], ['pnpm', 'pnpm-lock.yaml'], ['yarn', 'yarn.lock'],
    ] as const) {
      if (await exists(path.join(dir, lock))) signals.add(manager);
    }
  }
  const owner = await readManifest(app.workspaceDir);
  const declared = owner.packageManager?.split('@')[0];
  if (explicit && declared && explicit !== declared) throw new CliError(`--package-manager conflicts with the workspace's ${declared} declaration.`);
  if (explicit && signals.size && !signals.has(explicit)) {
    throw new CliError(`Using ${explicit} would create a second manager's lockfile. Resolve the existing manager configuration first.`);
  }
  if (explicit) return explicit;
  if (signals.size > 1) throw new CliError('Conflicting package-manager declarations or lockfiles. Resolve them or select --package-manager explicitly.');
  return signals.values().next().value ?? 'npm';
}

export function validateManagerVersion(manager: PackageManager, version: string): void {
  const range = manager === 'npm' ? '>=7' : manager === 'pnpm' ? '>=8' : '>=1 <2 || >=2 <5';
  if (!semver.valid(version) || !semver.satisfies(version, range)) {
    throw new CliError(`Unsupported ${manager} version ${version}; required ${range}. Install a supported manager manually.`);
  }
}
