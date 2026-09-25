import { type ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import CodeBlock from '@theme/CodeBlock';
import { ExternalLink } from 'lucide-react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';


interface CodeFile {
  filename: string;
  code: string;
  language?: string;
}

type DemoFramework = 'angular' | 'react' | 'vue';

interface LiveDemoProps {
  children?: ReactNode;
  /**
   * GitHub repository URL pointing to the directory containing the example files.
   * Must follow the format: `https://github.com/{owner}/{repo}/tree/{branch}/{path}`
   *
   * Used to derive:
   * - Raw content URL for fetching `repoFiles`
   * - StackBlitz URL (if `stackBlitzUrl` is not explicitly provided)
   */
  repoUrl?: string;
  /** Override the auto-derived StackBlitz URL. */
  stackBlitzUrl?: string;
  height?: string;
  /** URL of the hosted example to embed in an iframe as the preview. */
  iframeUrl?: string;
  /** Route segment for the demo (e.g. `/examples/agile-retro`) resolved against `customFields.demoBaseUrls`. */
  demoPath?: string;
  /** Optional framework override. Defaults to the docs route framework (`/docs/{framework}/...`). */
  demoFramework?: DemoFramework;
  /**
   * Paths relative to `repoUrl` in the GitHub repo.
   * Files are fetched at runtime and shown in the Code tab.
   * Example: `['src/app/examples/editor.component.ts']`
   */
  repoFiles?: string[];
  code?: string; // legacy, for single file
  codeTitle?: string;
  codeLang?: string;
  codeFiles?: CodeFile[];
}

/**
 * Parses a GitHub tree URL into its components.
 * Expected format: https://github.com/{owner}/{repo}/tree/{branch}/{path}
 */
function parseGitHubUrl(url: string) {
  const match = url.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/
  );
  if (!match) return null;
  const [, owner, repo, branch, path] = match;
  return { owner, repo, branch, path };
}

function buildRawBaseUrl(repoUrl: string): string | null {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return null;
  const { owner, repo, branch, path } = parsed;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}/`;
}

function getBranchVariants(branch: string): string[] {
  if (branch === 'main') {
    return ['main', 'master'];
  }
  if (branch === 'master') {
    return ['master', 'main'];
  }
  return [branch];
}

function buildRawBaseCandidates(repoUrl: string): string[] {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return [];
  }

  const { owner, repo, branch, path } = parsed;
  const branches = getBranchVariants(branch);
  const bases: string[] = [];

  for (const currentBranch of branches) {
    bases.push(`https://raw.githubusercontent.com/${owner}/${repo}/${currentBranch}/${path}/`);
  }

  return Array.from(new Set(bases));
}

function kebabToPascal(input: string): string {
  return input
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function buildRepoFileCandidates(file: string, framework: DemoFramework): string[] {
  const normalized = file.replace(/^\/+/, '');
  const candidates = [normalized];

  if (framework === 'angular') {
    return candidates;
  }

  const lastSlashIndex = normalized.lastIndexOf('/');
  const directory = lastSlashIndex === -1 ? '' : normalized.slice(0, lastSlashIndex);
  const filename = lastSlashIndex === -1 ? normalized : normalized.slice(lastSlashIndex + 1);
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) {
    return candidates;
  }

  const basename = filename.slice(0, dotIndex);
  const extension = filename.slice(dotIndex + 1);
  const supportsPagePattern = (framework === 'react' && extension === 'tsx') || (framework === 'vue' && extension === 'vue');
  const isKebabCase = basename.includes('-') && basename === basename.toLowerCase();

  if (supportsPagePattern && isKebabCase) {
    const pageFilename = `${kebabToPascal(basename)}Page.${extension}`;
    const pagePath = directory ? `${directory}/${pageFilename}` : pageFilename;
    candidates.push(pagePath);
  }

  return candidates;
}

function buildStackBlitzUrl(repoUrl: string, file?: string): string {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return repoUrl;
  const { owner, repo, branch, path } = parsed;
  const base = `https://stackblitz.com/github/${owner}/${repo}/tree/${branch}/${path}`;
  return file ? `${base}?file=${encodeURIComponent(file)}` : base;
}

function langFromFilename(filename: string): string {
  const ext = filename.split('.').pop() ?? '';
  const map: Record<string, string> = {
    ts: 'ts', tsx: 'tsx', html: 'html', css: 'css',
    scss: 'scss', json: 'json', js: 'js', jsx: 'jsx',
  };
  return map[ext] ?? 'text';
}

function getDemoBaseUrls(customFields: unknown): Partial<Record<DemoFramework, string>> {
  const fallback: Partial<Record<DemoFramework, string>> = {};
  if (!customFields || typeof customFields !== 'object') {
    return fallback;
  }

  const urls = (customFields as Record<string, unknown>).demoBaseUrls;
  if (!urls || typeof urls !== 'object') {
    return fallback;
  }

  const parsed = urls as Record<string, unknown>;
  const frameworks: DemoFramework[] = ['angular', 'react', 'vue'];
  for (const framework of frameworks) {
    const value = parsed[framework];
    if (typeof value === 'string' && value.trim().length > 0) {
      fallback[framework] = value.trim();
    }
  }

  return fallback;
}

function buildDemoUrl(demoBaseUrl: string, demoPath: string): string {
  if (/^https?:\/\//.test(demoPath)) {
    return demoPath;
  }

  const base = demoBaseUrl.replace(/\/+$/, '');
  const cleanedPath = demoPath.startsWith('#') ? demoPath.slice(1) : demoPath;
  const normalizedPath = cleanedPath.startsWith('/') ? cleanedPath : `/${cleanedPath}`;
  return `${base}/#${normalizedPath}`;
}

function getFrameworkFromPathname(pathname: string): DemoFramework | null {
  const match = pathname.match(/\/docs\/(angular|react|vue)(\/|$)/);
  if (!match) {
    return null;
  }
  return match[1] as DemoFramework;
}


export default function LiveDemo({
  children,
  repoUrl,
  stackBlitzUrl,
  height = '560px',
  iframeUrl,
  demoPath,
  demoFramework,
  repoFiles,
  code,
  codeTitle,
  codeLang = 'ts',
  codeFiles,
}: LiveDemoProps) {
  const { siteConfig } = useDocusaurusContext();
  const { pathname } = useLocation();
  const hasCode = Boolean(children || repoFiles?.length || codeFiles?.length || code);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [activeTab, setActiveTab] = useState(0);
  const [fetchedFiles, setFetchedFiles] = useState<CodeFile[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const demoBaseUrls = getDemoBaseUrls(siteConfig.customFields);
  const resolvedDemoFramework = demoFramework ?? getFrameworkFromPathname(pathname) ?? 'angular';
  const rawBase = repoUrl ? buildRawBaseUrl(repoUrl) : null;
  const rawBaseCandidates = repoUrl ? buildRawBaseCandidates(repoUrl) : [];
  const demoBaseUrl = demoBaseUrls[resolvedDemoFramework];
  const resolvedIframeUrl = iframeUrl ?? (demoPath && demoBaseUrl ? buildDemoUrl(demoBaseUrl, demoPath) : undefined);
  const resolvedStackBlitzUrl = stackBlitzUrl
    ?? (repoUrl ? buildStackBlitzUrl(repoUrl, repoFiles?.[0]) : undefined);

  useEffect(() => {
    if (view !== 'code' || !repoFiles?.length || !rawBase || hasFetched.current) {
      return;
    }
    hasFetched.current = true;
    setIsFetching(true);
    setFetchError(null);

    const fetchCodeFile = async (file: string): Promise<CodeFile> => {
      const fileCandidates = buildRepoFileCandidates(file, resolvedDemoFramework);

      for (const base of rawBaseCandidates) {
        for (const candidate of fileCandidates) {
          const res = await fetch(base + candidate);
          if (!res.ok) {
            continue;
          }
          return {
            filename: candidate.split('/').pop() ?? candidate,
            code: await res.text(),
            language: langFromFilename(candidate),
          };
        }
      }

      throw new Error(`404 – ${file}`);
    };

    Promise.all(
      repoFiles.map((file) => fetchCodeFile(file))
    )
      .then((files) => { setFetchedFiles(files); setActiveTab(0); })
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setIsFetching(false));
  }, [view, rawBase, rawBaseCandidates, repoFiles, resolvedDemoFramework]);

  const viewToggleRef = useCallback((node: HTMLButtonElement | null) => {
    if (!node) {
      return;
    }

    node.style.setProperty('font-family', 'var(--ifm-font-family-base)', 'important');
  }, []);
  const codeTabRef = useCallback((node: HTMLButtonElement | null) => {
    if (!node) {
      return;
    }

    node.style.setProperty('font-family', 'var(--ifm-font-family-base)', 'important');
  }, []);

  return (
    <div
      style={{
        marginBlock: '1.5rem',
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-color-emphasis-100)',
        }}
      >
        {hasCode && (
          <div
            role="tablist"
            aria-label="Live demo view"
            style={{
              display: 'inline-flex',
              gap: '0.15rem',
              padding: '0.15rem',
              borderRadius: '999px',
              background: 'var(--ifm-color-emphasis-200)',
            }}
          >
            <button
              ref={viewToggleRef}
              role="tab"
              aria-selected={view === 'preview'}
              onClick={() => setView('preview')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '0.3rem 0.9rem',
                cursor: 'pointer',
                lineHeight: 1.3,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--ifm-font-color-base)',
                background: view === 'preview' ? 'var(--ifm-background-surface-color)' : 'transparent',
                boxShadow:
                  view === 'preview'
                    ? '0 1px 2px rgba(0, 0, 0, 0.14), inset 0 0 0 1px rgba(0, 0, 0, 0.04)'
                    : 'none',
              }}
            >
              Preview
            </button>
            <button
              ref={viewToggleRef}
              role="tab"
              aria-selected={view === 'code'}
              onClick={() => setView('code')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '0.3rem 0.9rem',
                cursor: 'pointer',
                lineHeight: 1.3,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--ifm-font-color-base)',
                background: view === 'code' ? 'var(--ifm-background-surface-color)' : 'transparent',
                boxShadow:
                  view === 'code'
                    ? '0 1px 2px rgba(0, 0, 0, 0.14), inset 0 0 0 1px rgba(0, 0, 0, 0.04)'
                    : 'none',
              }}
            >
              Code
            </button>
          </div>
        )}
        {!hasCode && (
          <button
            ref={viewToggleRef}
            className="button button--sm button--primary"
            style={{ cursor: 'default' }}
          >
            Preview
          </button>
        )}
        {resolvedStackBlitzUrl && (
          <a
            href={resolvedStackBlitzUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button--sm button--secondary"
            aria-label="Open in StackBlitz"
            title="Open in StackBlitz"
            style={{
              marginLeft: 'auto',
              width: '2rem',
              height: '2rem',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>
      {view === 'preview' && (
        <div style={{ height }}>
          {resolvedIframeUrl && (
            <iframe
              src={resolvedIframeUrl}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title="Live demo preview"
            />
          )}
        </div>
      )}
      {view === 'code' && (
        <div style={{ margin: 0 }}>
          {repoFiles?.length ? (
            isFetching ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', fontFamily: 'var(--ifm-font-family-base)' }}>
                Loading files…
              </div>
            ) : fetchError ? (
              <div style={{ padding: '1rem', color: 'var(--ifm-color-danger-dark)', fontFamily: 'var(--ifm-font-family-base)' }}>
                Failed to load: {fetchError}
              </div>
            ) : (
              <>
                {fetchedFiles.length > 1 && (
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-background-surface-color)', fontFamily: 'var(--ifm-font-family-base)' }}>
                    {fetchedFiles.map((file, idx) => (
                      <button
                        key={file.filename}
                        ref={codeTabRef}
                        onClick={() => setActiveTab(idx)}
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontWeight: activeTab === idx ? 'bold' : 'normal',
                          borderBottom: activeTab === idx ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
                          fontFamily: 'var(--ifm-font-family-base)',
                        }}
                      >
                        {file.filename}
                      </button>
                    ))}
                  </div>
                )}
                {fetchedFiles[activeTab] && (
                  <CodeBlock language={fetchedFiles[activeTab].language ?? codeLang}>
                    {fetchedFiles[activeTab].code}
                  </CodeBlock>
                )}
              </>
            )
          ) : children ? (
            children
          ) : codeFiles && codeFiles.length > 0 ? (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-background-surface-color)', fontFamily: 'var(--ifm-font-family-base)' }}>
                {codeFiles.map((file, idx) => (
                  <button
                    key={file.filename}
                    ref={codeTabRef}
                    onClick={() => setActiveTab(idx)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontWeight: activeTab === idx ? 'bold' : 'normal',
                      borderBottom: activeTab === idx ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
                      fontFamily: 'var(--ifm-font-family-base)',
                    }}
                  >
                    {file.filename}
                  </button>
                ))}
              </div>
              <CodeBlock language={codeFiles[activeTab].language || codeLang}>
                {codeFiles[activeTab].code}
              </CodeBlock>
            </>
          ) : code ? (
            <CodeBlock language={codeLang} title={codeTitle}>
              {code}
            </CodeBlock>
          ) : null}
        </div>
      )}
    </div>
  );
}
