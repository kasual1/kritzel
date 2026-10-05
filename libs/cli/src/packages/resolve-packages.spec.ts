import { resolvePackages, packageNames, MetadataReader } from './resolve-packages';
import { ProjectContext } from '../shared/types';

const context: ProjectContext = {
  appDir: process.cwd(), workspaceDir: process.cwd(),
  manifest: { dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' } },
  framework: 'react', manager: 'npm', managerVersion: '10.0.0',
};
const installed = async (_context: ProjectContext, name: string) => name === 'react' || name === 'react-dom' ? '19.0.0' : undefined;
const reader: MetadataReader = async (_context, spec) => {
  const at = spec.lastIndexOf('@');
  const name = spec.slice(0, at);
  const peerDependencies: Record<string, string> = name === '@kritzel/engine' ? { yjs: '^13.6.27' } : {};
  return [{ name, version: name.startsWith('@kritzel/') ? '0.5.2' : '13.6.27', peerDependencies }];
};
describe('compatible package planning', () => {
  test.each(['angular', 'react', 'vue'] as const)('selects editor and engine package sets for %s', framework => {
    expect(packageNames({ ...context, framework }, 'engine')).toEqual([`@kritzel/${framework}-engine`, '@kritzel/engine']);
    expect(packageNames({ ...context, framework }, 'editor')).toEqual([`@kritzel/${framework}-editor`, '@kritzel/editor', '@kritzel/engine']);
  });
  test('resolves one exact release and explicitly adds required peers', async () => {
    const plan = await resolvePackages(context, 'engine', '0.5.2', reader, installed);
    expect(plan.specs).toEqual(['@kritzel/react-engine@0.5.2', '@kritzel/engine@0.5.2', 'yjs@13.6.27']);
    expect(plan.reused).toContain('react@19.0.0');
  });
  test.each(['latest', '^0.5.2', '0.5.2-beta.1', 'https://example.com/package.tgz'])('rejects non-stable exact release %s', async release => {
    await expect(resolvePackages(context, 'editor', release, reader, installed)).rejects.toThrow('exact stable');
  });
  test('rejects missing releases and inconsistent Kritzel peers', async () => {
    await expect(resolvePackages(context, 'editor', '0.5.3', reader, installed)).rejects.toThrow('not available');
    const mismatch: MetadataReader = async (ctx, spec) => (await reader(ctx, spec)).map(value => ({ ...value, peerDependencies: { '@kritzel/engine': '^0.6.0' } }));
    await expect(resolvePackages(context, 'editor', '0.5.2', mismatch, installed)).rejects.toThrow('Incompatible Kritzel');
  });
  test('never silently upgrades an incompatible framework', async () => {
    await expect(resolvePackages({ ...context, manifest: { dependencies: { react: '^17', 'react-dom': '^17' } } }, 'editor', '0.5.2', reader, installed)).rejects.toThrow('Incompatible react');
  });
  test('requires manual framework installation', async () => {
    await expect(resolvePackages({ ...context, manifest: {} }, 'editor', '0.5.2', reader, installed)).rejects.toThrow('Required peer react');
  });
  test('rejects other existing wrappers', async () => {
    await expect(resolvePackages({ ...context, manifest: { dependencies: { ...context.manifest.dependencies, '@kritzel/react-editor': '^0.5.2' } } }, 'engine', '0.5.2', reader, installed)).rejects.toThrow('different Kritzel wrapper');
  });
  test('preserves compatible declared ranges and reuses exact installed release', async () => {
    const deps = { ...context.manifest.dependencies, '@kritzel/react-editor': '^0.5.2', '@kritzel/editor': '^0.5.2', '@kritzel/engine': '^0.5.2', yjs: '^13.6.27' };
    const plan = await resolvePackages({ ...context, manifest: { dependencies: deps } }, 'editor', '0.5.2', reader,
      async (ctx, name) => name.startsWith('@kritzel/') ? '0.5.2' : name === 'yjs' ? '13.6.27' : installed(ctx, name));
    expect(plan.specs).toEqual([]);
  });
  test('does not mistake a declared missing dependency for an installed dependency', async () => {
    const ctx = { ...context, manifest: { dependencies: { ...context.manifest.dependencies, '@kritzel/engine': '^0.5.2' } } };
    const plan = await resolvePackages(ctx, 'engine', '0.5.2', reader, installed);
    expect(plan.specs).toContain('@kritzel/engine@0.5.2');
  });
  test('promotes a required runtime peer from development dependencies', async () => {
    const ctx = { ...context, manifest: { ...context.manifest, devDependencies: { yjs: '^13.6.27' } } };
    const plan = await resolvePackages(ctx, 'engine', '0.5.2', reader,
      async (value, name) => name === 'yjs' ? '13.6.27' : installed(value, name));
    expect(plan.specs).toContain('yjs@13.6.27');
  });
  test('does not reuse an ancestor framework version outside the app declaration', async () => {
    const ctx = { ...context, manifest: { dependencies: { react: '19.0.0', 'react-dom': '19.0.0' } } };
    const metadata: MetadataReader = async (value, spec) => spec.startsWith('react')
      ? [{ name: spec.split('@')[0], version: '19.0.0' }] : reader(value, spec);
    const plan = await resolvePackages(ctx, 'engine', '0.5.2', metadata,
      async (value, name) => name.startsWith('react') ? '19.3.0' : installed(value, name));
    expect(plan.specs).toContain('react@19.0.0');
    expect(plan.specs).toContain('react-dom@19.0.0');
  });
  test('unknown required peers fail, optional peers are ignored', async () => {
    const peers: MetadataReader = async (ctx, spec) => (await reader(ctx, spec)).map(value => ({ ...value, peerDependencies: { unexpected: '^1' }, peerDependenciesMeta: { unexpected: { optional: true } } }));
    await expect(resolvePackages(context, 'engine', '0.5.2', peers, installed)).resolves.toBeDefined();
    const required: MetadataReader = async (ctx, spec) => (await peers(ctx, spec)).map(value => ({ ...value, peerDependenciesMeta: {} }));
    await expect(resolvePackages(context, 'engine', '0.5.2', required, installed)).rejects.toThrow('Required peer unexpected');
  });
});
