const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const spawn = require('cross-spawn');
const { once } = require('node:events');

const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, '.validation'), { recursive: true });
const temp = fs.mkdtempSync(path.join(root, '.validation', 'managers-'));
const packageVersions = {
  '@kritzel/engine': require(path.join(root, 'package.json')).version,
  '@kritzel/editor': require(path.join(root, 'package.json')).version,
  '@kritzel/react-editor': require(path.join(root, 'package.json')).version,
  react: '19.0.0', 'react-dom': '19.0.0',
  typescript: '6.0.0',
  yjs: '13.6.27', lib0: '0.2.114', 'y-indexeddb': '9.0.12', 'y-websocket': '3.0.0',
};
const tarballs = new Map();
const manifests = new Map();
const server = http.createServer((request, response) => {
  const route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1);
  if (tarballs.has(route)) { response.end(tarballs.get(route)); return; }
  if (route.startsWith('-/')) { response.setHeader('Content-Type', 'application/json'); response.end('{}'); return; }
  const manifest = manifests.get(route);
  response.setHeader('Content-Type', 'application/json');
  if (!manifest) { response.statusCode = 404; response.end(JSON.stringify({ error: 'not found' })); return; }
  response.end(JSON.stringify({
    name: manifest.name, 'dist-tags': { latest: manifest.version },
    versions: { [manifest.version]: manifest }, time: { [manifest.version]: '2026-01-01T00:00:00.000Z' },
  }));
});

function run(command, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', errors = '';
    child.stdout.on('data', value => { output += value; });
    child.stderr.on('data', value => { errors += value; });
    const timeout = setTimeout(() => { child.kill(); reject(new Error(`${command} timed out`)); }, 180000);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('close', code => {
      clearTimeout(timeout);
      if (code) reject(new Error(`${command} ${args.join(' ')} failed (${code}):\n${output}\n${errors}`));
      else resolve(output.trim());
    });
  });
}
async function json(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, JSON.stringify(value, null, 2));
}
function shim(dir, command, script) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, process.platform === 'win32' ? `${command}.cmd` : command);
  fs.writeFileSync(file, process.platform === 'win32'
    ? `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`
    : `#!/bin/sh\nexec "${process.execPath}" "${script}" "$@"\n`, { mode: 0o755 });
}

async function generationSmoke({ fixture, app, env, updated }) {
  const bin = path.join(root, 'dist', 'bin.js');
  updated.devDependencies = { typescript: '6.0.0' };
  await json(path.join(app, 'package.json'), updated);
  await json(path.join(app, 'tsconfig.json'), { compilerOptions: { strict: true } });
  await fsp.mkdir(path.join(app, 'src'));
  const existing = path.join(app, 'src', 'App.tsx');
  await fsp.writeFile(existing, 'export const ExistingApp = () => null;\n');
  await run(process.execPath, [bin, 'init', '--cwd', app, '--yes', '--generate-component'], fixture, env);
  const generated = path.join(app, 'src', 'components', 'kritzel-canvas', 'KritzelCanvas.tsx');
  assert(fs.existsSync(generated));
  assert.equal(await fsp.readFile(existing, 'utf8'), 'export const ExistingApp = () => null;\n');
  const original = await fsp.readFile(generated, 'utf8');
  await assert.rejects(run(process.execPath, [bin, 'init', '--cwd', app, '--yes', '--generate-component'], fixture, env), /already exists|overwrite|conflict/i);
  assert.equal(await fsp.readFile(generated, 'utf8'), original);
  console.log('npm opt-in generation: new TS file, existing app preservation and --yes overwrite protection passed.');
}

async function main() {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const registry = `http://127.0.0.1:${server.address().port}`;
  const release = packageVersions['@kritzel/engine'];
  for (const [name, version] of Object.entries(packageVersions)) {
    const slug = name.replace(/[@/]/g, '-');
    const dir = path.join(temp, 'packages', slug);
    const peerDependencies = name === '@kritzel/engine'
      ? { yjs: '^13.6.27', lib0: '^0.2.114', 'y-indexeddb': '^9.0.12', 'y-websocket': '^3.0.0' }
      : name === '@kritzel/react-editor' ? { '@kritzel/editor': `^${release}`, '@kritzel/engine': `^${release}` }
      : name === '@kritzel/editor' ? { '@kritzel/engine': `^${release}` } : {};
    const manifest = { name, version, main: 'index.js', peerDependencies };
    await json(path.join(dir, 'package.json'), manifest);
    await fsp.writeFile(path.join(dir, 'index.js'), 'module.exports = {};\n');
    const result = JSON.parse(await run('npm', ['pack', '--json', '--pack-destination', dir], dir));
    const packed = Array.isArray(result) ? result[0] : result.filename ? result : Object.values(result)[0];
    assert.equal(packed.name, name, 'Registry fixture must pack its own package, not an ancestor workspace.');
    const tar = await fsp.readFile(path.join(dir, packed.filename));
    const route = `tar/${slug}.tgz`;
    tarballs.set(route, tar);
    manifests.set(name, { ...manifest, dist: {
      tarball: `${registry}/${route}`, shasum: crypto.createHash('sha1').update(tar).digest('hex'),
      integrity: `sha512-${crypto.createHash('sha512').update(tar).digest('base64')}`,
    } });
  }
  const tools = [
    { name: 'npm', script: process.env.npm_execpath, version: 'npm@12.0.2' },
    { name: 'pnpm', script: path.join(path.dirname(require.resolve('pnpm')), 'bin', 'pnpm.cjs'), version: 'pnpm@10.0.0' },
    { name: 'yarn', label: 'yarn-classic', script: require.resolve('yarn-classic/bin/yarn.js'), version: 'yarn@1.22.22' },
    { name: 'yarn', label: 'yarn-modern', script: require.resolve('yarn-modern/bin/yarn.js'), version: 'yarn@4.9.2' },
  ];
  let generationFixture;
  for (const tool of tools) {
    assert(tool.script, 'Run this check using npm run test:managers.');
    tool.version = `${tool.name}@${await run(process.execPath, [tool.script, '--version'], root)}`;
    for (const workspace of [false, true]) {
      const fixture = path.join(temp, `${tool.label || tool.name}-${workspace ? 'workspace' : 'standalone'}`);
      const app = workspace ? path.join(fixture, 'apps', 'board') : fixture;
      const appManifest = { name: 'canvas-smoke-app', version: '0.0.0', private: true, dependencies: { react: '19.0.0', 'react-dom': '19.0.0' } };
      await json(path.join(app, 'package.json'), appManifest);
      if (workspace) {
        await json(path.join(fixture, 'package.json'), { name: 'workspace-owner', private: true, packageManager: tool.version, workspaces: ['apps/*'] });
        if (tool.name === 'pnpm') await fsp.writeFile(path.join(fixture, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
      } else {
        await json(path.join(app, 'package.json'), { ...appManifest, packageManager: tool.version });
      }
      await fsp.writeFile(path.join(fixture, '.npmrc'), `registry=${registry}\naudit=false\nfund=false\n`);
      if (tool.label === 'yarn-classic') await fsp.writeFile(path.join(fixture, '.yarnrc'),
        `registry "${registry}"\nmodules-folder "${path.join(fixture, 'node_modules')}"\nlink-folder "${path.join(fixture, '.yarn-links')}"\ndisable-self-update-check true\n`);
      if (tool.label === 'yarn-modern') {
        await fsp.writeFile(path.join(fixture, '.yarnrc.yml'), `npmRegistryServer: "${registry}"\nunsafeHttpWhitelist:\n  - "127.0.0.1"\nnodeLinker: pnp\nenableGlobalCache: false\nenableTelemetry: false\n`);
        // This fixture is a separate project nested inside the repository.
        await fsp.writeFile(path.join(fixture, 'yarn.lock'), '');
      }
      const shimDir = path.join(fixture, 'manager-bin');
      shim(shimDir, tool.name, tool.script);
      const pathKey = Object.keys(process.env).find(key => key.toLowerCase() === 'path') || 'PATH';
      const env = {
        ...process.env,
        [pathKey]: `${shimDir}${path.delimiter}${process.env[pathKey]}`,
        npm_config_registry: registry,
        npm_config_cache: path.join(fixture, '.npm-cache'),
        npm_config_store_dir: path.join(fixture, '.pnpm-store'),
        YARN_CACHE_FOLDER: path.join(fixture, '.yarn-cache'),
        COREPACK_ENABLE_PROJECT_SPEC: '0',
      };
      const bin = path.join(root, 'dist', 'bin.js');
      const initial = await run(process.execPath, [bin, 'init', '--cwd', app, '--yes'], fixture, env);
      assert.match(initial, /successfully/);
      const updated = JSON.parse(await fsp.readFile(path.join(app, 'package.json'), 'utf8'));
      for (const name of ['@kritzel/react-editor', '@kritzel/editor', '@kritzel/engine', 'yjs', 'lib0', 'y-indexeddb', 'y-websocket']) assert.equal(updated.dependencies[name], packageVersions[name], name);
      if (workspace) assert.equal(JSON.parse(await fsp.readFile(path.join(fixture, 'package.json'), 'utf8')).dependencies, undefined);
      assert(!fs.existsSync(path.join(app, 'src')));
      const rerun = await run(process.execPath, [bin, 'init', '--cwd', app, '--yes'], fixture, env);
      assert.match(rerun, /already installed/,
        `${tool.label || tool.name}: framework resolved at ${require('node:module').createRequire(path.join(app, 'package.json')).resolve('react')}`);
      assert.deepEqual(JSON.parse(await fsp.readFile(path.join(app, 'package.json'), 'utf8')), updated);
      if (tool.name === 'npm' && !workspace) generationFixture = { fixture, app, env, updated };
      console.log(`${tool.label || tool.name} ${workspace ? 'workspace' : 'standalone'}: metadata, required peers, targeted install and idempotence passed.`);
    }
  }
  await generationSmoke(generationFixture);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await fsp.rm(temp, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
});
