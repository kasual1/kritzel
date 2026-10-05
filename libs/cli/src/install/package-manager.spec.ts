import { installArgs, metadataArgs, parseMetadata, run, selectClassicVersion, sanitizeDiagnostic } from './package-manager';
import { ProjectContext } from '../shared/types';

const context: ProjectContext = {
  appDir: 'C:\\project\\apps\\canvas', workspaceDir: 'C:\\project', manifest: { name: 'canvas', version: '0.0.0' },
  framework: 'react', manager: 'npm', managerVersion: '10.0.0',
};
describe('package-manager adapters', () => {
  test.each([
    ['npm', '10.0.0', ['install', '--workspace', 'canvas', '--save-prod', '--save-exact', '@kritzel/react-editor@0.5.2']],
    ['pnpm', '10.0.0', ['--filter', 'canvas', 'add', '--save-prod', '--save-exact', '@kritzel/react-editor@0.5.2']],
    ['yarn', '1.22.22', ['workspace', 'canvas', 'add', '--exact', '@kritzel/react-editor@0.5.2']],
    ['yarn', '4.9.2', ['workspace', 'canvas', 'add', '--exact', '@kritzel/react-editor@0.5.2']],
  ] as const)('targets workspace with %s %s', (manager, managerVersion, expected) => {
    expect(installArgs({ ...context, manager, managerVersion }, ['@kritzel/react-editor@0.5.2'])).toEqual(expected);
  });
  test('standalone installs exact production packages', () => {
    expect(installArgs({ ...context, appDir: context.workspaceDir }, ['react@19.0.0'])).toEqual(['install', '--save-prod', '--save-exact', 'react@19.0.0']);
    expect(installArgs({ ...context, appDir: context.workspaceDir, manager: 'pnpm' }, ['react@19.0.0'])).toEqual(['add', '--save-prod', '--save-exact', 'react@19.0.0']);
    expect(installArgs({ ...context, appDir: context.workspaceDir, manager: 'yarn' }, ['react@19.0.0'])).toEqual(['add', '--exact', 'react@19.0.0']);
  });
  test('rejects unnamed workspace target', () => {
    expect(() => installArgs({ ...context, manifest: {} }, [])).toThrow('package name');
  });
  test('rejects a versionless Yarn Classic workspace before install', () => {
    expect(() => installArgs({ ...context, manager: 'yarn', managerVersion: '1.22.22', manifest: { name: 'canvas' } }, [])).toThrow('valid version');
  });
  test('supports registry metadata protocols', () => {
    expect(metadataArgs(context, 'p@1.0.0')).toEqual(['view', 'p@1.0.0', '--json']);
    expect(metadataArgs({ ...context, manager: 'yarn', managerVersion: '1.22.22' }, 'p@1.0.0')).toEqual(['info', 'p@1.0.0', '--json']);
    expect(metadataArgs({ ...context, manager: 'yarn', managerVersion: '4.9.2' }, 'p@1.0.0')).toEqual(['npm', 'info', 'p@1.0.0', '--json']);
  });
  test('resolves Yarn Classic range metadata before requesting an exact version', () => {
    expect(selectClassicVersion('{"type":"inspect","data":["13.6.27","13.6.28","14.0.0"]}', '^13.6.27')).toBe('13.6.28');
    expect(() => selectClassicVersion('{"type":"inspect","data":["14.0.0"]}', '^13.6.27')).toThrow('no version');
  });
  test('parses pretty JSON, arrays and Yarn JSONL', () => {
    const value = { name: 'package', version: '1.0.0' };
    expect(parseMetadata(JSON.stringify(value, null, 2))).toEqual([value]);
    expect(parseMetadata(JSON.stringify([value]))).toEqual([value]);
    expect(parseMetadata(`{"type":"warning","data":"notice"}\n${JSON.stringify({ type: 'inspect', data: value })}`)).toEqual([value]);
    expect(() => parseMetadata('{"error":"no package"}')).toThrow('no valid');
    expect(() => parseMetadata('{"name":"p","version":"1.0.0","peerDependencies":{"p":2}}')).toThrow('Invalid peer');
    expect(() => parseMetadata('{"name":"p","version":"1.0.0","peerDependenciesMeta":{"p":null}}')).toThrow('Invalid optional');
  });
  test('launches with literal argument arrays including spaces and shell metacharacters', async () => {
    const value = 'path with spaces & $(do-not-execute)';
    expect(await run(process.execPath, ['-e', 'console.log(process.argv[1])', value], process.cwd())).toBe(value);
  });
  test('reports unsuccessful subprocesses', async () => {
    await expect(run(process.execPath, ['-e', 'process.exit(7)'], process.cwd())).rejects.toThrow('exit 7');
    await expect(run('kritzel-nonexistent-manager', ['--version'], process.cwd())).rejects.toThrow('Cannot run');
  });
  test('redacts credentials from captured manager diagnostics', () => {
    const text = sanitizeDiagnostic('https://user:secret@example.com/package?token=secret Authorization: Bearer secret _authToken=secret');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('user:');
    expect(text).toContain('https://example.com/package?redacted');
  });
});
