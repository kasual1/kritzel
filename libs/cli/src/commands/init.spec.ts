import { init, cliVersion } from './init';
import { discoverApps } from '../project/discover-project';
import { detectManager } from '../project/detect-package-manager';
import { managerVersion, install } from '../install/package-manager';
import { resolvePackages } from '../packages/resolve-packages';
import { prepareGeneration, writeGeneration } from '../generation/generate-component';

jest.mock('../project/discover-project');
jest.mock('../project/detect-package-manager');
jest.mock('../install/package-manager');
jest.mock('../packages/resolve-packages');
jest.mock('../generation/generate-component');
jest.mock('../output/next-steps', () => ({ nextSteps: () => 'Mount manually.' }));

const discovery = jest.mocked(discoverApps);
const resolve = jest.mocked(resolvePackages);
const installer = jest.mocked(install);
const generation = jest.mocked(prepareGeneration);
const writer = jest.mocked(writeGeneration);
const app = { appDir: process.cwd(), workspaceDir: process.cwd(), manifest: { dependencies: { react: '^19', 'react-dom': '^19' } } };

describe('init workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    discovery.mockResolvedValue([app]);
    const { frameworks, exists } = jest.requireMock('../project/discover-project') as { frameworks: jest.Mock; exists: jest.Mock };
    frameworks.mockReturnValue(['react']);
    exists.mockResolvedValue(true);
    jest.mocked(detectManager).mockResolvedValue('npm');
    jest.mocked(managerVersion).mockResolvedValue('10.0.0');
    resolve.mockResolvedValue({ specs: ['@kritzel/react-editor@0.5.2'], reused: [], release: '0.5.2' });
    installer.mockResolvedValue();
    generation.mockResolvedValue({ files: [{ path: 'canvas', content: 'canvas' }] });
    writer.mockResolvedValue(['canvas']);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => { jest.restoreAllMocks(); });
  test('defaults to installation only with editor', async () => {
    await init({ cwd: process.cwd(), yes: true });
    expect(resolve).toHaveBeenCalledWith(expect.anything(), 'editor', cliVersion());
    expect(installer).toHaveBeenCalled();
    expect(generation).not.toHaveBeenCalled();
    expect(writer).not.toHaveBeenCalled();
  });
  test('rejects output without opt-in generation before discovery', async () => {
    await expect(init({ cwd: '.', output: 'src/canvas', yes: true })).rejects.toThrow('--output requires');
    expect(discovery).not.toHaveBeenCalled();
  });
  test('fails noninteractive workspace ambiguity without choosing the first app', async () => {
    discovery.mockResolvedValue([app, { ...app, appDir: 'another' }]);
    await expect(init({ cwd: '.', yes: true })).rejects.toThrow('Multiple applications');
    expect(installer).not.toHaveBeenCalled();
  });
  test('does not claim success on installation failure', async () => {
    installer.mockRejectedValue(new Error('installation failed'));
    await expect(init({ cwd: '.', yes: true })).rejects.toThrow('installation failed');
    expect(writer).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('successfully'));
  });
  test('preflights generation before install, writes only after successful installation', async () => {
    discovery.mockResolvedValue([{ ...app, manifest: { ...app.manifest, devDependencies: { typescript: '^6' } } }]);
    await init({ cwd: '.', yes: true, generateComponent: true });
    expect(generation.mock.invocationCallOrder[0]).toBeLessThan(installer.mock.invocationCallOrder[0]);
    expect(installer.mock.invocationCallOrder[0]).toBeLessThan(writer.mock.invocationCallOrder[0]);
  });
  test('generation conflicts prevent install', async () => {
    discovery.mockResolvedValue([{ ...app, manifest: { ...app.manifest, devDependencies: { typescript: '^6' } } }]);
    generation.mockRejectedValue(new Error('already exists'));
    await expect(init({ cwd: '.', yes: true, generateComponent: true })).rejects.toThrow('already exists');
    expect(installer).not.toHaveBeenCalled();
  });
  test('JS and SSR apps allow install-only but reject starters', async () => {
    await expect(init({ cwd: '.', yes: true, generateComponent: true })).rejects.toThrow('TypeScript');
    discovery.mockResolvedValue([{ ...app, manifest: { dependencies: { react: '^19', next: '^15' } } }]);
    await expect(init({ cwd: '.', yes: true, generateComponent: true })).rejects.toThrow('SSR');
    await expect(init({ cwd: '.', yes: true })).resolves.toBeUndefined();
  });
});
