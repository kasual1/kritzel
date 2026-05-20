import { type ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import CodeBlock from '@theme/CodeBlock';
import { ExternalLink } from 'lucide-react';


interface CodeFile {
  filename: string;
  code: string;
  language?: string;
}

interface LiveDemoProps {
  children?: ReactNode;
  stackBlitzUrl?: string;
  height?: string;
  /** URL of the hosted example to embed in an iframe as the preview. */
  iframeUrl?: string;
  /**
   * Paths relative to the example directory in the GitHub repo.
   * Files are fetched at runtime and shown in the Code tab.
   * Example: `['src/app/editor.component.ts', 'src/app/app.component.html']`
   */
  repoFiles?: string[];
  code?: string; // legacy, for single file
  codeTitle?: string;
  codeLang?: string;
  codeFiles?: CodeFile[];
}

const GITHUB_PAGES_BASE = 'https://kritzelapp.github.io/examples/';
const RAW_GITHUB_BASE = 'https://raw.githubusercontent.com/kritzelapp/examples/main/';

function langFromFilename(filename: string): string {
  const ext = filename.split('.').pop() ?? '';
  const map: Record<string, string> = {
    ts: 'ts', tsx: 'tsx', html: 'html', css: 'css',
    scss: 'scss', json: 'json', js: 'js', jsx: 'jsx',
  };
  return map[ext] ?? 'text';
}


export default function LiveDemo({
  children,
  stackBlitzUrl,
  height = '400px',
  iframeUrl,
  repoFiles,
  code,
  codeTitle,
  codeLang = 'ts',
  codeFiles,
}: LiveDemoProps) {
  const hasCode = Boolean(children || repoFiles?.length || codeFiles?.length || code);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [activeTab, setActiveTab] = useState(0);
  const [fetchedFiles, setFetchedFiles] = useState<CodeFile[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const rawBase = iframeUrl?.startsWith(GITHUB_PAGES_BASE)
    ? RAW_GITHUB_BASE + iframeUrl.slice(GITHUB_PAGES_BASE.length)
    : null;

  useEffect(() => {
    if (view !== 'code' || !repoFiles?.length || !rawBase || hasFetched.current) {
      return;
    }
    hasFetched.current = true;
    setIsFetching(true);
    setFetchError(null);
    Promise.all(
      repoFiles.map(async (file) => {
        const res = await fetch(rawBase + file);
        if (!res.ok) {
          throw new Error(`${res.status} – ${file}`);
        }
        return {
          filename: file.split('/').pop() ?? file,
          code: await res.text(),
          language: langFromFilename(file),
        } as CodeFile;
      })
    )
      .then((files) => { setFetchedFiles(files); setActiveTab(0); })
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setIsFetching(false));
  }, [view, rawBase, repoFiles]);

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
        {stackBlitzUrl && (
          <a
            href={stackBlitzUrl}
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
          {iframeUrl && (
            <iframe
              src={iframeUrl}
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
