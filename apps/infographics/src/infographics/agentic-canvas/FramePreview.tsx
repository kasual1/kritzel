import { useEffect, type CSSProperties } from 'react';

export interface FramePreviewProps {
  title: string;
  document: string;
  onClose: () => void;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  background: '#ffffff',
  animation: 'frame-preview-in 180ms ease-out',
};

const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 44,
  padding: '0 8px 0 16px',
  borderBottom: '1px solid #e4e4e7',
  font: '500 14px system-ui, sans-serif',
  color: '#3f3f46',
};

const closeStyle: CSSProperties = {
  marginLeft: 'auto',
  height: 30,
  padding: '0 12px',
  border: 0,
  borderRadius: 8,
  background: '#f4f4f5',
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
};

/** Shows a frame's page fullscreen, as a real scrolling website. */
export function FramePreview({ title, document, onClose }: FramePreviewProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={`Preview of ${title}`}>
      <style>{'@keyframes frame-preview-in { from { opacity: 0; transform: scale(0.98); } }'}</style>
      <div style={barStyle}>
        <span>{title}</span>
        <button type="button" style={closeStyle} onClick={onClose} autoFocus>
          Close <kbd>Esc</kbd>
        </button>
      </div>
      <iframe title={title} srcDoc={document} sandbox="allow-scripts" style={{ flex: 1, width: '100%', border: 0 }} />
    </div>
  );
}
