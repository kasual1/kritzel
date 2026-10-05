import { lstat, mkdir, open, realpath, type FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { CliError, hasCode } from '../shared/errors';
import { ComponentKind, Framework, ProjectContext } from '../shared/types';
import { angularEditorFiles } from './templates/angular-editor';
import { angularEngineFiles } from './templates/angular-engine';
import { reactEditorFiles } from './templates/react-editor';
import { reactEngineFiles } from './templates/react-engine';
import { vueEditorFiles } from './templates/vue-editor';
import { vueEngineFiles } from './templates/vue-engine';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationPlan {
  files: GeneratedFile[];
}

export class GenerationWriteError extends CliError {
  constructor(
    message: string,
    readonly writtenFiles: string[],
    readonly failedFile: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GenerationWriteError';
  }
}

const planRoots = new WeakMap<GenerationPlan, string>();
const templates: Record<Framework, Record<ComponentKind, GeneratedFile[]>> = {
  angular: { editor: angularEditorFiles, engine: angularEngineFiles },
  react: { editor: reactEditorFiles, engine: reactEngineFiles },
  vue: { editor: vueEditorFiles, engine: vueEngineFiles },
};

function resolveOutputDirectory(appRoot: string, output: string | undefined, framework: Framework): string {
  if (output === undefined) {
    const conventionalDirectory = framework === 'angular' ? 'src/app' : 'src/components';
    return path.join(appRoot, conventionalDirectory, 'kritzel-canvas');
  }
  if (!output.trim() || path.isAbsolute(output) || /^[a-zA-Z]:/.test(output) || output.startsWith('\\\\')) {
    throw new CliError('The output directory must be a non-empty path relative to the selected application.');
  }

  const segments = output.split(/[\\/]+/).filter(Boolean);
  if (segments.some(segment => segment === '..')) {
    throw new CliError('The output directory cannot contain parent-directory traversal.');
  }
  const target = path.resolve(appRoot, ...segments);
  const relative = path.relative(appRoot, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new CliError('The output directory must stay inside the selected application.');
  }
  return target;
}

async function assertDirectoryPath(root: string, directory: string, create: boolean): Promise<void> {
  const relative = path.relative(root, directory);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new CliError('Generated files must stay inside the selected application.');
  }

  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      const entry = await lstat(current);
      if (entry.isSymbolicLink()) {
        throw new CliError(`Refusing to generate through symbolic link: ${current}`);
      }
      if (!entry.isDirectory()) {
        throw new CliError(`Output path is not a directory: ${current}`);
      }
    } catch (error) {
      if (!hasCode(error, 'ENOENT')) throw error;
      if (!create) return;
      try {
        await mkdir(current);
      } catch (mkdirError) {
        if (!hasCode(mkdirError, 'EEXIST')) throw mkdirError;
      }
      const created = await lstat(current);
      if (created.isSymbolicLink() || !created.isDirectory()) {
        throw new CliError(`Output path changed while preparing generation: ${current}`);
      }
    }
  }

  const resolved = await realpath(directory);
  const resolvedRelative = path.relative(root, resolved);
  if (resolvedRelative === '..' || resolvedRelative.startsWith(`..${path.sep}`) || path.isAbsolute(resolvedRelative)) {
    throw new CliError('The output directory resolves outside the selected application.');
  }
}

async function assertTargetDoesNotExist(target: string): Promise<boolean> {
  try {
    await lstat(target);
    return false;
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return true;
    throw error;
  }
}

function generationFailure(
  message: string,
  writtenFiles: string[],
  failedFile: string,
  cause?: unknown,
): GenerationWriteError {
  return new GenerationWriteError(
    `Dependency installation already succeeded. ${message}`,
    [...writtenFiles],
    failedFile,
    cause === undefined ? undefined : { cause },
  );
}

function relativeFile(appRoot: string, outputDirectory: string, fileName: string): string {
  return path.relative(appRoot, path.join(outputDirectory, fileName))
    .split(path.sep)
    .join('/');
}

function safeTarget(root: string, filePath: string): string {
  if (!filePath || path.isAbsolute(filePath) || filePath.split(/[\\/]+/).some(segment => segment === '..')) {
    throw new CliError(`Invalid generated file path: ${filePath}`);
  }
  const target = path.resolve(root, filePath);
  const relative = path.relative(root, target);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new CliError(`Generated file path escapes the selected application: ${filePath}`);
  }
  return target;
}

export async function prepareGeneration(
  context: ProjectContext,
  component: ComponentKind,
  output?: string,
): Promise<GenerationPlan> {
  const appRoot = await realpath(context.appDir);
  const outputDirectory = resolveOutputDirectory(appRoot, output, context.framework);

  if (output === undefined) {
    const conventionalBase = path.join(appRoot, context.framework === 'angular' ? 'src/app' : 'src');
    try {
      const entry = await lstat(conventionalBase);
      if (!entry.isDirectory() || entry.isSymbolicLink()) {
        throw new CliError(`The conventional source directory is not a real directory: ${conventionalBase}`);
      }
    } catch (error) {
      if (hasCode(error, 'ENOENT')) {
        throw new CliError(`No conventional source directory was found. Specify an output directory with --output.`);
      }
      throw error;
    }
    await assertDirectoryPath(appRoot, conventionalBase, false);
  }
  await assertDirectoryPath(appRoot, outputDirectory, false);

  const generated = templates[context.framework][component];
  const plan: GenerationPlan = {
    files: generated.map(file => ({
      path: relativeFile(appRoot, outputDirectory, file.path),
      content: file.content,
    })),
  };

  const collisions: string[] = [];
  for (const file of plan.files) {
    const target = safeTarget(appRoot, file.path);
    if (!(await assertTargetDoesNotExist(target))) collisions.push(file.path);
  }
  if (collisions.length) {
    throw new CliError(
      `Cannot generate over existing path(s): ${collisions.join(', ')}. Choose another output directory or remove the conflicting files yourself.`,
    );
  }

  planRoots.set(plan, appRoot);
  return plan;
}

export async function writeGeneration(plan: GenerationPlan): Promise<string[]> {
  const appRoot = planRoots.get(plan);
  if (!appRoot) {
    throw generationFailure('This plan was not created by prepareGeneration in this process.', [], '<generation plan>');
  }
  if (!Array.isArray(plan.files) || plan.files.length === 0) {
    throw generationFailure('The generation plan has no files.', [], '<generation plan>');
  }

  const writtenFiles: string[] = [];
  let failedFile = '<generation setup>';
  let failedFileMayBePartial = false;
  try {
    const targets = plan.files.map(file => {
      failedFile = file.path;
      if (typeof file.content !== 'string') throw new CliError(`Invalid content for generated file: ${file.path}`);
      return { file, target: safeTarget(appRoot, file.path) };
    });
    const uniqueTargets = new Set(targets.map(({ target }) => target));
    if (uniqueTargets.size !== targets.length) throw new CliError('The generation plan contains duplicate file paths.');

    const collisions: string[] = [];
    for (const { file, target } of targets) {
      failedFile = file.path;
      await assertDirectoryPath(appRoot, path.dirname(target), false);
      if (!(await assertTargetDoesNotExist(target))) collisions.push(file.path);
    }
    if (collisions.length) {
      failedFile = collisions[0];
      throw new CliError(
        `Cannot generate over existing path(s): ${collisions.join(', ')}. Choose another output directory or remove the conflicting files yourself.`,
      );
    }

    for (const { file, target } of targets) {
      failedFile = file.path;
      await assertDirectoryPath(appRoot, path.dirname(target), true);
    }

    for (const { file, target } of targets) {
      failedFile = file.path;
      let handle: FileHandle | undefined;
      try {
        await assertDirectoryPath(appRoot, path.dirname(target), false);
        handle = await open(target, 'wx');
        failedFileMayBePartial = true;
        await handle.writeFile(file.content, 'utf8');
        const completedHandle = handle;
        handle = undefined;
        await completedHandle.close();
        writtenFiles.push(file.path);
        failedFileMayBePartial = false;
      } catch (error) {
        if (handle) {
          try {
            await handle.close();
          } catch (closeError) {
            throw new AggregateError([error, closeError], 'Writing and closing the generated file both failed.');
          }
        }
        throw error;
      }
    }
    return writtenFiles;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const completed = writtenFiles.length ? ` Files written: ${writtenFiles.join(', ')}.` : ' No files were written.';
    const partial = failedFileMayBePartial ? ' The failed file may be incomplete; inspect it before retrying.' : '';
    throw generationFailure(
      `Generation failed while processing ${failedFile}: ${reason}.${completed}${partial}`,
      writtenFiles,
      failedFile,
      error,
    );
  }
}
