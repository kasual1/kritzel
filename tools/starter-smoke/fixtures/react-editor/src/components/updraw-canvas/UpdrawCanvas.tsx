import { useState } from 'react';
import { UpdrawEditor } from '@updraw/react-editor';

const editorId = 'updraw-canvas';
const canvasStyle = { display: 'block', width: '100%', height: 480 };

export function UpdrawCanvas() {
  const [isReady, setIsReady] = useState(false);

  return (
    <section>
      <UpdrawEditor
        editorId={editorId}
        onIsReady={() => setIsReady(true)}
        style={canvasStyle}
        aria-label="Updraw canvas"
      />
      <p role="status">{isReady ? 'Updraw is ready.' : 'Loading Updraw…'}</p>
    </section>
  );
}
