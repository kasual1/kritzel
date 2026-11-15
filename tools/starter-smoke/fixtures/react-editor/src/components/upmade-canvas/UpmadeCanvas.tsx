import { useState } from 'react';
import { UpmadeEditor } from '@upmade/react-editor';

const editorId = 'upmade-canvas';
const canvasStyle = { display: 'block', width: '100%', height: 480 };

export function UpmadeCanvas() {
  const [isReady, setIsReady] = useState(false);

  return (
    <section>
      <UpmadeEditor
        editorId={editorId}
        onIsReady={() => setIsReady(true)}
        style={canvasStyle}
        aria-label="Upmade canvas"
      />
      <p role="status">{isReady ? 'Upmade is ready.' : 'Loading Upmade…'}</p>
    </section>
  );
}
