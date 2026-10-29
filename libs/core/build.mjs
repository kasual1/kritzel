import { context, build } from 'esbuild';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const watch = process.argv.includes('--watch');

// One bundle per format, so every consumer of @kritzel/core shares one module instance.
// yjs and its companions stay external, exactly as in the Stencil builds, otherwise Yjs
// warns "Yjs was already imported" and its constructor checks break.
const shared = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  // Tools rely on `this.constructor.name`, so keep class names through bundling.
  keepNames: true,
  sourcemap: true,
  minify: false,
  tsconfig: 'tsconfig.build.json',
  external: ['yjs', 'y-websocket', 'y-indexeddb', 'y-protocols', 'y-protocols/*', 'lib0', 'lib0/*'],
  logLevel: 'info',
};

const formats = [
  { format: 'esm', outfile: 'dist/esm/index.mjs' },
  { format: 'cjs', outfile: 'dist/cjs/index.cjs' },
];

if (watch) {
  for (const options of formats) {
    const ctx = await context({ ...shared, ...options });
    await ctx.watch();
  }
  const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
  spawn(process.execPath, [tsc, '-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput'], { stdio: 'inherit' });
} else {
  await Promise.all(formats.map(options => build({ ...shared, ...options })));
}
