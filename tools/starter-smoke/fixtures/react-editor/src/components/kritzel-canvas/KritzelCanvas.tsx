import { useState } from 'react';
import { KritzelEditor } from '@kritzel/react-editor';

const editorId = 'kritzel-canvas';
const canvasStyle = { display: 'block', width: '100%', height: 480 };

export function KritzelCanvas() {
  const [isReady, setIsReady] = useState(false);

  return (
    <section>
      <KritzelEditor
        editorId={editorId}
        onIsReady={() => setIsReady(true)}
        style={canvasStyle}
        aria-label="Kritzel canvas"
      />
      <p role="status">{isReady ? 'Kritzel is ready.' : 'Loading Kritzel…'}</p>
    </section>
  );
}
