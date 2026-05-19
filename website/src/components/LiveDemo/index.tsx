import { type ReactNode, type ReactElement, useState, useCallback, Children, cloneElement, isValidElement } from 'react';
import CodeBlock from '@theme/CodeBlock';
import { ExternalLink } from 'lucide-react';


interface CodeFile {
  filename: string;
  code: string;
  language?: string;
}

interface LiveDemoProps {
  children: ReactNode;
  stackBlitzUrl?: string;
  height?: string;
  /** When provided, this node is rendered in the preview pane (with cursorTarget injected)
   *  and `children` is rendered as-is in the code pane (e.g. a highlighted MDX code block). */
  preview?: ReactNode;
  code?: string; // legacy, for single file
  codeTitle?: string;
  codeLang?: string;
  codeFiles?: CodeFile[];
}


export default function LiveDemo({
  children,
  stackBlitzUrl,
  height = '400px',
  preview,
  code,
  codeTitle,
  codeLang = 'ts',
  codeFiles,
}: LiveDemoProps) {
  const hasCode = Boolean(codeFiles?.length || code || preview);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [previewEl, setPreviewEl] = useState<HTMLDivElement | null>(null);
  const previewRef = useCallback((node: HTMLDivElement | null) => {
    setPreviewEl(node);
  }, []);
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
  const [activeTab, setActiveTab] = useState(0);

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
        <div ref={previewRef} style={{ height, position: 'relative' }}>
          {previewEl &&
            Children.map(preview ?? children, (child) =>
              isValidElement(child)
                ? cloneElement(child as ReactElement<any>, { cursorTarget: previewEl })
                : child
            )}
        </div>
      )}
      {view === 'code' && (
        <div style={{ margin: 0 }}>
          {preview ? (
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
