import path from 'node:path';
import { CliError } from '../shared/errors';
import { ComponentKind, Framework } from '../shared/types';

const documentation: Record<Framework, string> = {
  angular: 'https://kritzel.io/docs/angular/getting-started/quick-start',
  react: 'https://kritzel.io/docs/react/getting-started/quick-start',
  vue: 'https://kritzel.io/docs/vue/getting-started/quick-start',
};

const toolDocumentation: Record<Framework, string> = {
  angular: 'https://kritzel.io/docs/angular/fundamentals/tools',
  react: 'https://kritzel.io/docs/react/fundamentals/tools',
  vue: 'https://kritzel.io/docs/vue/fundamentals/tools',
};

function matchingFile(files: string[], suffix: string): string {
  const match = files.find(file => file.replace(/\\/g, '/').endsWith(suffix));
  if (!match) throw new CliError(`Cannot print generation instructions: missing generated ${suffix}.`);
  return match.replace(/\\/g, '/');
}

function importFromSource(file: string, importerDirectory: string): string {
  const normalized = file.replace(/\\/g, '/');
  const appRelative = normalized.replace(/^\.\/+/, '');
  const withoutSourceRoot = appRelative.startsWith('src/') ? appRelative.slice('src/'.length) : appRelative;
  const withoutExtension = withoutSourceRoot.replace(/\.(tsx?|vue)$/, '');
  let relative = path.posix.relative(importerDirectory, withoutExtension);
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

function idReminder(): string {
  return 'Use a distinct editorId for every canvas instance; change the starter ID before mounting more than one.';
}

function manualExample(framework: Framework, component: ComponentKind): string {
  if (component === 'engine') {
    const packageName = `@kritzel/${framework}-engine`;
    const readyEvent = framework === 'angular' ? '(isEngineReady)' : framework === 'react' ? 'onIsEngineReady' : '@isEngineReady';
    return `Import { KritzelEngine } from '${packageName}', mount it with editorId="my-canvas", and initialize it from ${readyEvent}.`;
  }
  if (framework === 'angular') {
    return `Add provideKritzel() from @kritzel/angular-editor to the application providers, import the standalone KritzelEditor proxy in the host component, and mount <kritzel-editor editorId="my-canvas"></kritzel-editor>.`;
  }
  if (framework === 'react') {
    return `Import { KritzelEditor } from '@kritzel/react-editor' and mount <KritzelEditor editorId="my-canvas" onIsReady={handleReady} />.`;
  }
  return `Import { KritzelEditor } from '@kritzel/vue-editor' and mount <KritzelEditor editorId="my-canvas" @isReady="handleReady" />.`;
}

function engineExample(framework: Framework): string {
  const packageName = `@kritzel/${framework}-engine`;
  const readyEvent = framework === 'angular' ? '(isEngineReady)' : framework === 'react' ? 'onIsEngineReady' : '@isEngineReady';
  return `Import { KritzelEngine } from '${packageName}' and wait for ${readyEvent} before calling engine methods. The engine has no built-in UI; register and activate the tools you need.`;
}

export function nextSteps(framework: Framework, component: ComponentKind, files: string[]): string {
  const lines = ['Next steps:'];

  if (framework === 'angular') {
    const providerName = `@kritzel/angular-${component}`;
    lines.push(
      `- Register Kritzel by importing provideKritzel from '${providerName}' and adding provideKritzel() to the providers in your application config.`,
    );
    if (files.length) {
      const tsFile = matchingFile(files, 'kritzel-canvas.component.ts');
      const componentImport = importFromSource(tsFile, 'app');
      lines.push(
        `- Import KritzelCanvasComponent from '${componentImport}' in the host component and add it to that standalone component's imports; then mount <kritzel-canvas /> in its template.`,
        `- For an NgModule host, add the standalone component to the NgModule imports and mount its selector in the host template. Follow the Angular quick start for custom-element registration: ${documentation.angular}`,
      );
    } else {
      lines.push(`- Manual example: ${manualExample(framework, component)}`);
    }
  } else if (files.length) {
    const fileName = framework === 'react' ? 'KritzelCanvas.tsx' : 'KritzelCanvas.vue';
    const componentFile = matchingFile(files, fileName);
    const importerDirectory = '.';
    const componentImport = importFromSource(componentFile, importerDirectory);
    if (framework === 'react') {
      lines.push(
        `- Import KritzelCanvas from '${componentImport}' in App.tsx and mount <KritzelCanvas />.`,
      );
    } else {
      lines.push(
        `- Import KritzelCanvas from '${componentImport}' in App.vue and mount <KritzelCanvas /> in its template.`,
      );
    }
  } else {
    lines.push(`- Manual example: ${manualExample(framework, component)}`);
  }

  if (component === 'engine') {
    lines.push(`- ${engineExample(framework)}`);
    lines.push(`- Customize the generated tool registration for your app: ${toolDocumentation[framework]}`);
  } else {
    lines.push(`- Framework setup and editor API: ${documentation[framework]}`);
  }
  lines.push(`- ${idReminder()}`);
  if (files.length) lines.push(`- Generated files: ${files.join(', ')}`);
  return lines.join('\n');
}
