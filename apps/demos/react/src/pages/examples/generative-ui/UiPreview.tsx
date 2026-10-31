import { useEffect } from "react";

export interface UiPreviewProps {
  title: string;
  document: string;
  onClose: () => void;
}

/** Shows a UI fullscreen, outside the canvas. */
export function UiPreview({ title, document, onClose }: UiPreviewProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="ui-preview" role="dialog" aria-modal="true" aria-label={`Preview of ${title}`}>
      <div className="ui-preview__bar">
        <span>{title}</span>
        <button type="button" className="ui-preview__close" onClick={onClose} autoFocus>
          Close <kbd>Esc</kbd>
        </button>
      </div>
      <iframe className="ui-preview__frame" title={title} srcDoc={document} sandbox="allow-scripts" />
    </div>
  );
}
