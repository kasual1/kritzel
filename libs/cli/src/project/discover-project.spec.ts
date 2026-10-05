import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { discoverApps, frameworks } from './discover-project';
import { detectManager, validateManagerVersion } from './detect-package-manager';

describe('project discovery', () => {
  let dir: string;
  beforeEach(async () => {
    const scratch = path.resolve(__dirname, '..', '..', '.validation');
    await mkdir(scratch, { recursive: true });
    dir = await mkdtemp(path.join(scratch, 'discovery-'));
  });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });
  async function manifest(relative: string, value: object) {
    const target = path.join(dir, relative);
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, 'package.json'), JSON.stringify(value));
    return target;
  }
  test('detects supported frameworks in both dependency sections', () => {
    expect(frameworks({ dependencies: { react: '^19' }, devDependencies: { vue: '^3.5', '@angular/core': '^22' } })).toEqual(['angular', 'react', 'vue']);
  });
  test('selects a nested leaf and finds its workspace owner', async () => {
    await manifest('', { workspaces: ['apps/*'], dependencies: { '@angular/core': '^22' } });
    const app = await manifest('apps/board', { name: 'board', dependencies: { react: '^19' } });
    await mkdir(path.join(app, 'src'));
    expect(await discoverApps(path.join(app, 'src'))).toEqual([expect.objectContaining({ appDir: app, workspaceDir: dir })]);
    expect(await discoverApps(dir)).toHaveLength(1);
  });
  test('enumerates multiple workspace applications, respecting exclusions', async () => {
    await manifest('', { workspaces: { packages: ['apps/*', '!apps/excluded'] } });
    await manifest('apps/a', { dependencies: { react: '^19' } });
    await manifest('apps/b', { dependencies: { vue: '^3.5' } });
    await manifest('apps/excluded', { dependencies: { react: '^19' } });
    expect(await discoverApps(dir)).toHaveLength(2);
  });
  test('reads pnpm workspace patterns', async () => {
    await manifest('', {});
    await writeFile(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n  - "!apps/skip"\n');
    await manifest('apps/board', { dependencies: { vue: '^3.5' } });
    await manifest('apps/skip', { dependencies: { vue: '^3.5' } });
    expect(await discoverApps(dir)).toHaveLength(1);
  });
  test('refuses duplicate workspace names and escaping patterns', async () => {
    await manifest('', { workspaces: ['apps/*'] });
    await manifest('apps/a', { name: 'duplicate', dependencies: { react: '^19' } });
    await manifest('apps/b', { name: 'duplicate', dependencies: { vue: '^3.5' } });
    await expect(discoverApps(dir)).rejects.toThrow('Duplicate workspace');
    await manifest('', { workspaces: ['../*'] });
    await expect(discoverApps(dir)).rejects.toThrow('must stay inside');
  });
  test('fails explicitly for malformed manifests and invalid workspace declarations', async () => {
    await manifest('', { dependencies: { react: 12 } });
    await expect(discoverApps(dir)).rejects.toThrow('Invalid dependencies');
    await manifest('', { workspaces: 'apps/*' });
    await expect(discoverApps(dir)).rejects.toThrow('Invalid workspaces');
  });
  test('does not manufacture a framework', async () => {
    await manifest('', {});
    await expect(discoverApps(dir)).rejects.toThrow('No supported framework');
  });
  test('honors owning manager and refuses accidental second lockfiles', async () => {
    await manifest('', { workspaces: ['apps/*'], packageManager: 'pnpm@10.0.0' });
    await manifest('apps/a', { dependencies: { react: '^19' } });
    const [app] = await discoverApps(path.join(dir, 'apps/a'));
    expect(await detectManager(app)).toBe('pnpm');
    await expect(detectManager(app, 'npm')).rejects.toThrow('conflicts');
  });
  test('rejects ambiguous lockfiles unless explicitly selected', async () => {
    await manifest('', { dependencies: { react: '^19' } });
    await writeFile(path.join(dir, 'yarn.lock'), '');
    await writeFile(path.join(dir, 'package-lock.json'), '{}');
    const [app] = await discoverApps(dir);
    await expect(detectManager(app)).rejects.toThrow('Conflicting');
    expect(await detectManager(app, 'yarn')).toBe('yarn');
    await expect(detectManager(app, 'pnpm')).rejects.toThrow('second manager');
  });
  test('validates manager versions', () => {
    for (const version of ['1.22.22', '3.8.0', '4.9.2']) expect(() => validateManagerVersion('yarn', version)).not.toThrow();
    expect(() => validateManagerVersion('pnpm', '7.0.0')).toThrow('Unsupported');
    expect(() => validateManagerVersion('npm', 'not-a-version')).toThrow('Unsupported');
  });
});
