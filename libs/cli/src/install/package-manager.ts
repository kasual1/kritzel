import spawn from 'cross-spawn';
import semver from 'semver';
import { CliError, CancelledError, hasCode } from '../shared/errors';
import { PackageManager, ProjectContext, PackageMetadata } from '../shared/types';
import { validateManagerVersion } from '../project/detect-package-manager';

export async function run(command: string, args: string[], cwd: string, inherit = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let interrupted = false;
    const terminate = () => {
      if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        killer.once('error', error => {
          console.error(`Could not stop package-manager process ${child.pid}: ${error.message}. Stop this process manually.`);
        });
      } else child.kill('SIGTERM');
    };
    const timeout = inherit ? undefined : setTimeout(() => {
      timedOut = true;
      terminate();
    }, 60_000);
    // Metadata errors can contain registry URLs; do not dump authenticated configuration.
    child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-8000); });
    const cancel = () => { interrupted = true; terminate(); };
    process.once('SIGINT', cancel);
    child.once('error', error => {
      process.removeListener('SIGINT', cancel);
      clearTimeout(timeout);
      reject(new CliError(`Cannot run ${command}: ${error.message}. Install the selected package manager manually.`));
    });
    child.once('close', (code, signal) => {
      process.removeListener('SIGINT', cancel);
      clearTimeout(timeout);
      if (timedOut) reject(new CliError(`${command} ${args[0]} timed out. Check package-manager and registry connectivity.`));
      else if (interrupted || signal === 'SIGINT' || signal === 'SIGTERM') reject(new CancelledError('Interrupted. The package manager may have changed dependencies; inspect the manifest and lockfile before retrying.'));
      else if (code !== 0) reject(new CliError(`${command} ${args[0]} failed (exit ${code}). Check registry access, authentication and package compatibility. ${inherit ? 'Inspect the package-manager output above; the manifest/lockfile may have changed.' : sanitizeDiagnostic(stderr || stdout)}`));
      else resolve(stdout.trim());
    });
  });
}

export function sanitizeDiagnostic(output: string): string {
  return output.slice(-3000)
    .replace(/https?:\/\/[^\s"'<>]+/g, value => {
      try {
        const url = new URL(value);
        url.username = '';
        url.password = '';
        if (url.search) url.search = '?redacted';
        return url.toString();
      } catch (error) {
        if (hasCode(error, 'ERR_INVALID_URL')) return '[invalid registry URL]';
        throw error;
      }
    })
    .replace(/\b(Bearer|Basic)\s+\S+/gi, '$1 [redacted]')
    .replace(/((?:_authToken|_auth|authorization|password|token)["']?\s*[:=]\s*["']?)[^\s"',]+/gi, '$1[redacted]');
}

export async function managerVersion(manager: PackageManager, cwd: string): Promise<string> {
  const version = await run(manager, ['--version'], cwd);
  validateManagerVersion(manager, version);
  return version;
}

export function metadataArgs(context: ProjectContext, spec: string): string[] {
  if (context.manager !== 'yarn') return ['view', spec, '--json'];
  return semver.major(context.managerVersion) === 1
    ? ['info', spec, '--json'] : ['npm', 'info', spec, '--json'];
}

export function parseMetadata(text: string): PackageMetadata[] {
  const entries: unknown[] = text.split(/\r?\n/).filter(Boolean).map(line => {
    try { return JSON.parse(line) as unknown; }
    catch { return undefined; }
  });
  // npm pretty-prints JSON; Yarn emits JSONL envelopes.
  let parsed: unknown;
  try { parsed = JSON.parse(text) as unknown; }
  catch { parsed = entries; }
  const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
  const results: PackageMetadata[] = [];
  for (const entry of queue) {
    if (!entry || typeof entry !== 'object') continue;
    if ('type' in entry && 'data' in entry) {
      if (entry.type === 'inspect') queue.push(entry.data);
      continue;
    }
    if ('name' in entry && 'version' in entry && typeof entry.name === 'string' && typeof entry.version === 'string') {
      const peerDependencies = 'peerDependencies' in entry ? entry.peerDependencies : undefined;
      if (peerDependencies !== undefined && (!peerDependencies || typeof peerDependencies !== 'object' ||
          Array.isArray(peerDependencies) ||
          Object.values(peerDependencies).some(value => typeof value !== 'string'))) {
        throw new CliError('Invalid peer metadata returned by registry.');
      }
      if ('peerDependenciesMeta' in entry && entry.peerDependenciesMeta !== undefined) {
        const meta = entry.peerDependenciesMeta;
        if (!meta || typeof meta !== 'object' || Array.isArray(meta) ||
            Object.values(meta).some(value => !value || typeof value !== 'object' ||
              ('optional' in value && typeof value.optional !== 'boolean'))) {
          throw new CliError('Invalid optional peer metadata returned by registry.');
        }
      }
      if (!semver.valid(entry.version)) throw new CliError('Registry returned an invalid package version.');
      results.push(entry as PackageMetadata);
    }
  }
  if (!results.length) throw new CliError('Registry returned no valid package metadata. Check the requested release and manager registry configuration.');
  return results;
}

export async function metadata(context: ProjectContext, spec: string): Promise<PackageMetadata[]> {
  if (context.manager === 'yarn' && semver.major(context.managerVersion) === 1) {
    const at = spec.lastIndexOf('@');
    const range = spec.slice(at + 1);
    if (!semver.valid(range)) {
      const output = await run('yarn', ['info', spec, 'versions', '--json'], context.workspaceDir);
      const version = selectClassicVersion(output, range);
      spec = `${spec.slice(0, at)}@${version}`;
    }
  }
  return parseMetadata(await run(context.manager, metadataArgs(context, spec), context.workspaceDir));
}

export function selectClassicVersion(output: string, range: string): string {
  const versions: string[] = [];
  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const value: unknown = JSON.parse(line);
    if (value && typeof value === 'object' && 'type' in value && value.type === 'inspect' &&
        'data' in value && Array.isArray(value.data)) {
      for (const entry of value.data) {
        if (typeof entry === 'string' && semver.valid(entry) && semver.satisfies(entry, range)) versions.push(entry);
      }
    }
  }
  const latest = versions.sort(semver.rcompare)[0];
  if (!latest) throw new CliError(`Yarn Classic registry returned no version satisfying ${range}.`);
  return latest;
}

export function installArgs(context: ProjectContext, specs: string[]): string[] {
  if (context.appDir === context.workspaceDir) {
    if (context.manager === 'npm') return ['install', '--save-prod', '--save-exact', ...specs];
    if (context.manager === 'pnpm') return ['add', '--save-prod', '--save-exact', ...specs];
    return ['add', '--exact', ...specs];
  }
  const name = context.manifest.name;
  if (!name) throw new CliError('Workspace application needs a package name for targeted installation.');
  if (context.manager === 'yarn' && semver.major(context.managerVersion) === 1 &&
      !semver.valid(context.manifest.version)) {
    throw new CliError('Yarn Classic requires a valid version in the workspace application manifest. Add it manually before running init.');
  }
  if (context.manager === 'npm') return ['install', '--workspace', name, '--save-prod', '--save-exact', ...specs];
  if (context.manager === 'pnpm') return ['--filter', name, 'add', '--save-prod', '--save-exact', ...specs];
  return ['workspace', name, 'add', '--exact', ...specs];
}

export async function install(context: ProjectContext, specs: string[]): Promise<void> {
  if (!specs.length) return;
  await run(context.manager, installArgs(context, specs), context.workspaceDir, true);
  if (context.manager === 'yarn' && semver.major(context.managerVersion) === 1 && context.appDir !== context.workspaceDir) {
    // Classic workspace add can remove existing hoisted dependencies; verify the root tree afterward.
    await run('yarn', ['install', '--check-files'], context.workspaceDir, true);
  }
}
