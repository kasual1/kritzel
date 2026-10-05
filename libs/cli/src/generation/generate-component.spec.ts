import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CliError } from '../shared/errors';
import { ProjectContext } from '../shared/types';
import { prepareGeneration, writeGeneration } from './generate-component';

describe('component generation', () => {
  let temporaryDirectory: string;

  async function createApp(framework: ProjectContext['framework']): Promise<ProjectContext> {
    const appDir = path.join(temporaryDirectory, framework);
    const sourceDirectory = framework === 'angular' ? 'src/app' : 'src/components';
    await mkdir(path.join(appDir, sourceDirectory), { recursive: true });
    return {
      appDir,
      workspaceDir: appDir,
      manifest: { name: 'template-fixture', dependencies: {} },
      framework,
      manager: 'npm',
      managerVersion: '10.0.0',
    };
  }

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'kritzel-cli-generation-'));
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  test.each([
    ['angular', 'editor', ['kritzel-canvas.component.ts', 'kritzel-canvas.component.html', 'kritzel-canvas.component.scss']],
    ['angular', 'engine', ['kritzel-canvas.component.ts', 'kritzel-canvas.component.html', 'kritzel-canvas.component.scss']],
    ['react', 'editor', ['KritzelCanvas.tsx']],
    ['react', 'engine', ['KritzelCanvas.tsx']],
    ['vue', 'editor', ['KritzelCanvas.vue']],
    ['vue', 'engine', ['KritzelCanvas.vue']],
  ] as const)('%s %s renders its fixed files', async (framework, component, fileNames) => {
    const context = await createApp(framework);
    const plan = await prepareGeneration(context, component);
    expect(plan.files.map(file => path.posix.basename(file.path.replace(/\\/g, '/')))).toEqual(fileNames);
    expect(plan.files.every(file => file.path.startsWith('src/'))).toBe(true);
    expect(plan.files.every(file => file.content.length > 0)).toBe(true);
  });

  test.each([
    ['angular', 'editor', 'KritzelEditor', 'isReady'],
    ['react', 'editor', 'KritzelEditor', 'onIsReady'],
    ['vue', 'editor', 'KritzelEditor', '@isReady'],
  ] as const)('%s editor template observes readiness and has local sizing', async (framework, component, wrapper, readyEvent) => {
    const context = await createApp(framework);
    const plan = await prepareGeneration(context, component);
    const content = plan.files.map(file => file.content).join('\n');
    expect(content).toContain(wrapper);
    expect(content).toContain(readyEvent);
    expect(content).toMatch(/height:\s*480(px)?/);
    expect(content).toContain("kritzel-canvas");
    expect(content).not.toContain('syncConfig');
    expect(content).not.toContain('document.body');
  });

  test.each([
    ['angular', 'isEngineReady'],
    ['react', 'onIsEngineReady'],
    ['vue', '@isEngineReady'],
  ] as const)('%s engine template registers tools sequentially and reports errors', async (framework, readyEvent) => {
    const context = await createApp(framework);
    const plan = await prepareGeneration(context, 'engine');
    const content = plan.files.map(file => file.content).join('\n');
    const selection = content.indexOf("registerTool('selection'");
    const brush = content.indexOf("registerTool('brush'");
    const eraser = content.indexOf("registerTool('eraser'");
    const activateBrush = content.indexOf("setActiveTool('brush')");

    expect(selection).toBeGreaterThanOrEqual(0);
    expect(brush).toBeGreaterThan(selection);
    expect(eraser).toBeGreaterThan(brush);
    expect(activateBrush).toBeGreaterThan(eraser);
    expect(content).toContain('KritzelSelectionTool');
    expect(content).toContain('KritzelBrushTool');
    expect(content).toContain('KritzelEraserTool');
    expect(content).toContain('role="alert"');
    expect(content).toContain(readyEvent);
    expect(content).not.toContain('syncConfig');
  });

  test('writes only new files and returns app-relative paths', async () => {
    const context = await createApp('react');
    const plan = await prepareGeneration(context, 'editor');
    const written = await writeGeneration(plan);

    expect(written).toEqual(['src/components/kritzel-canvas/KritzelCanvas.tsx']);
    expect(await readFile(path.join(context.appDir, ...written[0].split('/')), 'utf8')).toContain('KritzelEditor');
  });

  test('requires an explicit output path when the conventional source layout is missing', async () => {
    const context = await createApp('vue');
    await rm(path.join(context.appDir, 'src'), { recursive: true });

    await expect(prepareGeneration(context, 'editor')).rejects.toThrow('--output');
  });

  test.each(['react', 'vue'] as const)('creates the default components directory for a conventional %s src layout', async framework => {
    const context = await createApp(framework);
    await rm(path.join(context.appDir, 'src/components'), { recursive: true });
    const appFile = framework === 'react' ? 'App.tsx' : 'App.vue';
    await writeFile(path.join(context.appDir, 'src', appFile), 'host component', 'utf8');
    await writeFile(path.join(context.appDir, 'tsconfig.json'), '{}', 'utf8');

    const plan = await prepareGeneration(context, 'editor');
    expect(plan.files[0].path).toBe(`src/components/kritzel-canvas/${framework === 'react' ? 'KritzelCanvas.tsx' : 'KritzelCanvas.vue'}`);
    const written = await writeGeneration(plan);
    expect(await readFile(path.join(context.appDir, ...written[0].split('/')), 'utf8')).toBe(plan.files[0].content);
    expect(await readFile(path.join(context.appDir, 'src', appFile), 'utf8')).toBe('host component');
  });

  test.each(['../outside', 'src/../../outside', 'C:\\outside'])('rejects escaping output path %s', async output => {
    const context = await createApp('react');

    await expect(prepareGeneration(context, 'editor', output)).rejects.toThrow(CliError);
  });

  test('rejects a file created after planning without changing any existing file', async () => {
    const context = await createApp('angular');
    const plan = await prepareGeneration(context, 'editor', 'src/generated');
    const conflictingFile = path.join(context.appDir, 'src/generated/kritzel-canvas.component.html');
    await mkdir(path.dirname(conflictingFile), { recursive: true });
    await writeFile(conflictingFile, 'keep me', 'utf8');

    await expect(writeGeneration(plan)).rejects.toThrow(CliError);
    expect(await readFile(conflictingFile, 'utf8')).toBe('keep me');
    await expect(readFile(path.join(path.dirname(conflictingFile), 'kritzel-canvas.component.ts'), 'utf8'))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('concurrent writes never replace the files created by the winner', async () => {
    const context = await createApp('react');
    const firstPlan = await prepareGeneration(context, 'editor', 'src/generated');
    const secondPlan = await prepareGeneration(context, 'editor', 'src/generated');
    firstPlan.files[0].content = 'first generation';
    secondPlan.files[0].content = 'second generation';

    const results = await Promise.allSettled([writeGeneration(firstPlan), writeGeneration(secondPlan)]);
    const successful = results.filter(result => result.status === 'fulfilled');
    const rejected = results.filter(result => result.status === 'rejected');
    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const target = path.join(context.appDir, 'src/generated/KritzelCanvas.tsx');
    const winner = results[0].status === 'fulfilled' ? firstPlan : secondPlan;
    expect(await readFile(target, 'utf8')).toBe(winner.files[0].content);
  });

  test('rejects a plan path mutated to escape the app before creating files', async () => {
    const context = await createApp('react');
    const plan = await prepareGeneration(context, 'editor', 'src/generated');
    plan.files[0].path = '../outside.tsx';

    await expect(writeGeneration(plan)).rejects.toThrow(CliError);
    await expect(readFile(path.join(temporaryDirectory, 'outside.tsx'), 'utf8'))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('reports completed files when a later exclusive write fails', async () => {
    const context = await createApp('angular');
    const plan = await prepareGeneration(context, 'editor', 'src/generated');
    const laterFile = plan.files[1];
    let contentReads = 0;
    Object.defineProperty(laterFile, 'content', {
      get: () => {
        contentReads += 1;
        if (contentReads === 1) return 'validated content';
        throw new Error('injected write failure');
      },
    });

    await expect(writeGeneration(plan)).rejects.toMatchObject({
      name: 'GenerationWriteError',
      writtenFiles: [plan.files[0].path],
      failedFile: laterFile.path,
      message: expect.stringContaining('Dependency installation already succeeded'),
    });
    expect(await readFile(path.join(context.appDir, ...plan.files[0].path.split('/')), 'utf8')).toBe(plan.files[0].content);
    expect(await readFile(path.join(context.appDir, ...laterFile.path.split('/')), 'utf8')).toBe('');
  });

  test('refuses symlinked output directories when symlinks are available', async () => {
    const context = await createApp('vue');
    const outside = path.join(temporaryDirectory, 'outside');
    await mkdir(outside);
    const link = path.join(context.appDir, 'src/components/linked');
    try {
      await symlink(outside, link, 'junction');
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOTSUP') return;
      throw error;
    }

    await expect(prepareGeneration(context, 'editor', 'src/components/linked'))
      .rejects.toThrow(/symbolic link/i);
  });
});
