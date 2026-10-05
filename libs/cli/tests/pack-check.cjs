const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const spawn = require('cross-spawn');

const root = path.resolve(__dirname, '..');
const scratch = path.join(root, '.validation');
fs.mkdirSync(scratch, { recursive: true });
const dir = fs.mkdtempSync(path.join(scratch, 'pack-'));
function run(command, args, cwd) {
  const result = spawn.sync(command, args, { cwd, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error || result.stderr || result.stdout}`);
  return result.stdout.trim();
}
try {
  const result = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', dir], root));
  const packed = Array.isArray(result) ? result[0] : result.filename ? result : Object.values(result)[0];
  const entries = packed.files.map(file => file.path);
  assert(entries.includes('dist/bin.js'));
  assert(entries.includes('LICENSE'));
  assert(entries.includes('README.md'));
  assert(!entries.some(file => /(?:^|\/)(?:src|tests|node_modules)(?:\/|$)/.test(file) || /\.spec\.|\.map$/.test(file)));
  assert(fs.readFileSync(path.join(root, 'dist', 'bin.js'), 'utf8').startsWith('#!/usr/bin/env node'));
  const consumer = path.join(dir, 'consumer');
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ name: 'packed-cli-consumer', private: true }));
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(dir, packed.filename)], consumer);
  const bin = path.join(consumer, 'node_modules', '@kritzel', 'cli', 'dist', 'bin.js');
  const version = require(path.join(root, 'package.json')).version;
  assert.equal(run(process.execPath, [bin, '--version'], consumer), version);
  assert.match(run(process.execPath, [bin, 'init', '--help'], consumer), /--generate-component/);
  const invalid = spawn.sync(process.execPath, [bin, 'init', '--cwd', consumer, '--yes'], { cwd: consumer, encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /No supported framework/);
  assert(!fs.existsSync(path.join(consumer, 'src')));
  console.log(`Packed CLI ${version}: executable, runtime dependencies, help/version and consumer error checks passed.`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
