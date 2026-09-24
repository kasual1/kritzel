import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

type Framework = 'angular' | 'react' | 'vue';

interface LiveDemoBlock {
  filePath: string;
  repoUrl: string;
  demoPath: string;
  repoFiles: string[];
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const websiteRoot = path.resolve(currentDir, '..');
const repositoryRoot = path.resolve(websiteRoot, '..', '..');
const docsRoot = path.join(websiteRoot, 'docs');

const frameworkConfigs: Record<Framework, { docsDir: string; repoUrl: string; repoFilePrefix: string; repoFileExtension: string }> = {
  angular: {
    docsDir: path.join(docsRoot, 'angular'),
    repoUrl: 'https://github.com/kasual1/kritzel/tree/main/demos/angular',
    repoFilePrefix: 'src/app/',
    repoFileExtension: '.ts',
  },
  react: {
    docsDir: path.join(docsRoot, 'react'),
    repoUrl: 'https://github.com/kasual1/kritzel/tree/main/demos/react',
    repoFilePrefix: 'src/pages/',
    repoFileExtension: '.tsx',
  },
  vue: {
    docsDir: path.join(docsRoot, 'vue'),
    repoUrl: 'https://github.com/kasual1/kritzel/tree/main/demos/vue',
    repoFilePrefix: 'src/pages/',
    repoFileExtension: '.vue',
  },
};

function readMarkdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return readMarkdownFiles(fullPath);
    }

    if (entry.isFile() && /\.mdx?$/i.test(entry.name)) {
      return [fullPath];
    }

    return [];
  });
}

function parseLiveDemoBlocks(filePath: string): LiveDemoBlock[] {
  const markdown = fs.readFileSync(filePath, 'utf8');
  const blocks: LiveDemoBlock[] = [];

  for (const match of markdown.matchAll(/<LiveDemo\b([\s\S]*?)\/>/g)) {
    const attributes = match[1];
    const repoUrl = attributes.match(/repoUrl="([^"]+)"/)?.[1];
    const demoPath = attributes.match(/demoPath="([^"]+)"/)?.[1];
    const repoFilesMatch = attributes.match(/repoFiles=\{\[([\s\S]*?)\]\}/);
    const repoFiles = repoFilesMatch
      ? Array.from(repoFilesMatch[1].matchAll(/['"]([^'"]+)['"]/g), (item) => item[1])
      : [];

    if (!repoUrl || !demoPath) {
      throw new Error(`Unable to parse LiveDemo attributes in ${filePath}`);
    }

    blocks.push({ filePath, repoUrl, demoPath, repoFiles });
  }

  return blocks;
}

function getAllLiveDemoBlocks(framework: Framework): LiveDemoBlock[] {
  const files = readMarkdownFiles(frameworkConfigs[framework].docsDir);
  return files.flatMap((filePath) => parseLiveDemoBlocks(filePath));
}

describe('LiveDemo contract checks', () => {
  for (const framework of ['angular', 'react', 'vue'] as Framework[]) {
    test(`${framework} docs use expected repo and source paths`, () => {
      const config = frameworkConfigs[framework];
      const blocks = getAllLiveDemoBlocks(framework);

      expect(blocks.length).toBeGreaterThan(0);

      for (const block of blocks) {
        expect(block.repoUrl).toBe(config.repoUrl);
        expect(block.demoPath).toMatch(/^\/[A-Za-z0-9/-]+$/);
        expect(block.demoPath).not.toMatch(/\/$/);
        expect(block.repoFiles.length).toBeGreaterThan(0);

        for (const repoFile of block.repoFiles) {
          expect(repoFile.startsWith(config.repoFilePrefix)).toBe(true);
          expect(repoFile.endsWith(config.repoFileExtension)).toBe(true);
          expect(repoFile).not.toContain('..');
        }
      }
    });

    test(`${framework} docs reference demo sources that exist on disk`, () => {
      const demoRoot = path.join(repositoryRoot, 'apps', 'demos', framework);
      const missing = getAllLiveDemoBlocks(framework)
        .flatMap((block) => block.repoFiles.map((repoFile) => ({ block, repoFile })))
        .filter(({ repoFile }) => !fs.existsSync(path.join(demoRoot, repoFile)))
        .map(({ block, repoFile }) => `${path.relative(docsRoot, block.filePath)} -> ${repoFile}`);

      expect(missing).toEqual([]);
    });
  }
});