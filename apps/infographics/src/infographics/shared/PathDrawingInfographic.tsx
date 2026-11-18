import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  UpmadeDynamicObject,
  UpmadeEditor,
  UpmadeWorkspace,
  type HTMLUpmadeEditorElement,
} from "@upmade/react-editor";
import { animatePathDrawing } from "./animate-path-drawing";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

interface PathDrawingInfographicProps {
  id: string;
  name: string;
  /** Creates the drawing; its SVG must carry `aria-label={name}` so it can be found again. */
  createDrawing: () => UpmadeDynamicObject;
  /** Total drawing time in milliseconds. */
  duration?: number;
  /** Wait before the drawing starts, in milliseconds. */
  delay?: number;
}

/** How long the finished drawing stays before it is removed again, in milliseconds. */
const CLEAR_DELAY = 1500;

/**
 * An editor whose only object is an SVG drawing that is centered and animated on load, then removed 1.5 seconds
 * after it is drawn. Reload to play it again.
 */
export function PathDrawingInfographic({ id, name, createDrawing, duration, delay }: PathDrawingInfographicProps) {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
  const isUnmountedRef = useRef(false);
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);
  const [workspaces] = useState(() => {
    const drawing = createDrawing();
    // An object occupies width / scale world units, so a larger scale makes it smaller on screen.
    drawing.scale = Math.max(
      1,
      drawing.width / Math.max(window.innerWidth - 48, 1),
      drawing.height / Math.max(window.innerHeight - 48, 1),
    );
    return [new UpmadeWorkspace({ id, name, objects: [drawing] })];
  });

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const objects = await editor.getAllObjects();
    const drawing = objects.find(
      (object): object is UpmadeDynamicObject =>
        object instanceof UpmadeDynamicObject &&
        !!object.element?.querySelector(`svg[aria-label="${name}"]`),
    );
    if (!drawing) {
      return;
    }

    await editor.centerObjectInViewport(drawing);
    await animatePathDrawing(drawing.element, duration, delay);

    await new Promise(resolve => setTimeout(resolve, CLEAR_DELAY));
    if (isUnmountedRef.current) {
      return;
    }
    await editor.removeObjects([drawing]);
  }

  return (
    <div style={hostStyle}>
      <UpmadeEditor
        ref={editorRef}
        editorId={`infographic-${id}`}
        workspaces={workspaces}
        activeWorkspaceId={id}
        isWatermarkVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void onReady()}
      />
    </div>
  );
}
