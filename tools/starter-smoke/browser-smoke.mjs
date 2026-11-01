import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readConfiguration, performCompilation, formatDiagnostics } from '@angular/compiler-cli';
import { chromium } from '@playwright/test';
import { TemplatePage } from './template-page.mjs';

async function prepareBrowserEntry(context, appDirectory) {
  const { framework, component, files } = context;
  let entry;
  if (framework === 'angular') {
    const componentFile = files.find(file => file.endsWith('.component.ts'));
    assert(componentFile);
    const outputDirectory = path.join(appDirectory, 'compiled');
    const configFile = path.join(appDirectory, 'tsconfig.browser.json');
    await writeFile(configFile, JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        experimentalDecorators: true,
        strict: true,
        skipLibCheck: true,
        rootDir: path.dirname(componentFile),
        outDir: outputDirectory,
      },
      angularCompilerOptions: { strictTemplates: true },
      files: [componentFile],
    }));
    const config = readConfiguration(configFile);
    const compilation = performCompilation({ rootNames: config.rootNames, options: config.options });
    const errors = [...config.errors, ...compilation.diagnostics].filter(diagnostic => diagnostic.category === 1);
    if (errors.length) throw new Error(formatDiagnostics(errors));
    entry = `import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideKritzel } from '@kritzel/angular-${component}';
import { KritzelCanvasComponent } from './compiled/kritzel-canvas.component.js';
bootstrapApplication(KritzelCanvasComponent, { providers: [provideKritzel()] }).catch(error => { console.error(error); });
`;
  } else if (framework === 'react') {
    entry = `import React from 'react';
import { createRoot } from 'react-dom/client';
import { KritzelCanvas } from './src/components/kritzel-canvas/KritzelCanvas';
createRoot(document.getElementById('app')).render(React.createElement(KritzelCanvas));
`;
  } else {
    entry = `import { createApp } from 'vue';
import KritzelCanvas from './src/components/kritzel-canvas/KritzelCanvas.vue';
createApp(KritzelCanvas).mount('#app');
`;
  }
  await writeFile(path.join(appDirectory, 'main.tsx'), entry);
  await writeFile(path.join(appDirectory, 'index.html'), `<!doctype html>
<html><head><meta charset="UTF-8"><title>Kritzel generated starter</title></head>
<body>${framework === 'angular' ? '<kritzel-canvas></kritzel-canvas>' : '<div id="app"></div>'}
<script>
if (new URLSearchParams(location.search).has('fail-registration')) {
  const define = customElements.define.bind(customElements);
  customElements.define = (name, constructor, options) => {
    if (name === 'kritzel-engine') {
      constructor.prototype.registerTool = async () => null;
    }
    return define(name, constructor, options);
  };
}
document.addEventListener('${component === 'engine' ? 'isEngineReady' : 'isReady'}', () => {
  document.documentElement.dataset.kritzelReady = '${component}';
}, true);
document.addEventListener('activeToolChange', event => {
  document.documentElement.dataset.activeTool = event.detail.toolType;
}, true);
</script>
<script type="module" src="/main.tsx"></script></body></html>`);
}

export async function runBrowserSmoke(contexts, temporaryDirectory) {
  const browser = await chromium.launch();
  try {
    for (const context of contexts) {
      const sourceFile = context.files[0];
      const appDirectory = path.join(temporaryDirectory, 'apps', `${context.framework}-${context.component}`);
      assert(sourceFile.startsWith(appDirectory));
      await mkdir(appDirectory, { recursive: true });
      await prepareBrowserEntry(context, appDirectory);
      const config = {
        configFile: false,
        root: appDirectory,
        logLevel: 'error',
        plugins: context.framework === 'vue' ? [vue()] : [],
        esbuild: { jsx: 'automatic' },
        build: { outDir: 'browser-dist', emptyOutDir: true, minify: false },
        preview: { host: '127.0.0.1', port: 0, strictPort: false },
      };
      await build(config);
      const server = await preview(config);
      const address = server.httpServer.address();
      assert(address && typeof address !== 'string');
      const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
      try {
        const template = new TemplatePage(page, context.component);
        await template.open(`http://127.0.0.1:${address.port}`);
        if (context.component === 'engine') await template.drawStroke();
        await template.expectNoErrors();
        if (context.component === 'engine') {
          await template.expectInitializationFailure(`http://127.0.0.1:${address.port}`);
        }
        console.log(`Browser smoke passed: ${context.framework} ${context.component} readiness, sizing${context.component === 'engine' ? ', brush activation, drawing and visible initialization failure' : ''}.`);
      } finally {
        await page.close();
        await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
      }
    }
  } finally {
    await browser.close();
  }
}
