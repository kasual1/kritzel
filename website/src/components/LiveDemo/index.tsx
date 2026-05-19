import { type ReactNode, type ReactElement, useState, useCallback, Children, cloneElement, isValidElement } from 'react';
import CodeBlock from '@theme/CodeBlock';

interface LiveDemoProps {
  children: ReactNode;
  stackBlitzUrl?: string;
  height?: string;
  code?: string;
  codeTitle?: string;
  codeLang?: string;
}

export default function LiveDemo({
  children,
  stackBlitzUrl,
  height = '400px',
  code,
  codeTitle,
  codeLang = 'ts',
}: LiveDemoProps) {
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [previewEl, setPreviewEl] = useState<HTMLDivElement | null>(null);
  const previewRef = useCallback((node: HTMLDivElement | null) => {
    setPreviewEl(node);
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
        <button
          onClick={() => setView('preview')}
          className={`button button--sm ${view === 'preview' ? 'button--primary' : 'button--secondary'}`}
        >
          Preview
        </button>
        {code && (
          <button
            onClick={() => setView('code')}
            className={`button button--sm ${view === 'code' ? 'button--primary' : 'button--secondary'}`}
          >
            Code
          </button>
        )}
        {stackBlitzUrl && (
          <a
            href={stackBlitzUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button--sm button--secondary"
            style={{ marginLeft: 'auto' }}
          >
            Open in StackBlitz ↗
          </a>
        )}
      </div>
      {view === 'preview' && (
        <div ref={previewRef} style={{ height, position: 'relative' }}>
          {previewEl &&
            Children.map(children, (child) =>
              isValidElement(child)
                ? cloneElement(child as ReactElement<any>, { cursorTarget: previewEl })
                : child
            )}
        </div>
      )}
      {view === 'code' && code && (
        <div style={{ margin: 0 }}>
          <CodeBlock language={codeLang} title={codeTitle}>
            {code}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}
