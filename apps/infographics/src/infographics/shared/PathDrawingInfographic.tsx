import { useRef, useState, type CSSProperties } from "react";
import {
  KritzelDynamicObject,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
} from "@kritzel/react-editor";
import { animatePathDrawing } from "./animate-path-drawing";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

interface PathDrawingInfographicProps {
  id: string;
  name: string;
  /** Creates the drawing; its SVG must carry `aria-label={name}` so it can be found again. */
  createDrawing: () => KritzelDynamicObject;
}

/** An editor whose only object is an SVG drawing that is centered and animated on load. */
export function PathDrawingInfographic({ id, name, createDrawing }: PathDrawingInfographicProps) {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces] = useState(() => {
    const drawing = createDrawing();
    // An object occupies width / scale world units, so a larger scale makes it smaller on screen.
    drawing.scale = Math.max(
      1,
      drawing.width / Math.max(window.innerWidth - 48, 1),
      drawing.height / Math.max(window.innerHeight - 48, 1),
    );
    return [new KritzelWorkspace({ id, name, objects: [drawing] })];
  });

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const objects = await editor.getAllObjects();
    const drawing = objects.find(
      (object): object is KritzelDynamicObject =>
        object instanceof KritzelDynamicObject &&
        !!object.element?.querySelector(`svg[aria-label="${name}"]`),
    );
    if (!drawing) {
      return;
    }

    await editor.centerObjectInViewport(drawing);
    animatePathDrawing(drawing.element);
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId={`infographic-${id}`}
        workspaces={workspaces}
        activeWorkspaceId={id}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void onReady()}
      />
    </div>
  );
}
