import { CSSProperties, useEffect, useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "kritzel-react";
import {
  createImageStackCustomElement,
  setupImageStackRenderer,
} from "./custom-elements/imageStackCustomElement";
import {
  createRocketTodoCustomElement,
  setupRocketTodoRenderer,
} from "./custom-elements/rocketTodoCustomElement";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

export function WebsiteHeroPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasAddedInitialCustomElement = useRef(false);

  useEffect(() => {
    const cleanupRocketTodoRenderer = setupRocketTodoRenderer();
    const cleanupImageStackRenderer = setupImageStackRenderer();

    return () => {
      cleanupRocketTodoRenderer();
      cleanupImageStackRenderer();
    };
  }, []);

  async function onReady() {
    if (hasAddedInitialCustomElement.current) {
      return;
    }

    const objectCount = await editorRef.current?.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      return;
    }

    hasAddedInitialCustomElement.current = true;

    await editorRef.current?.addObject(createRocketTodoCustomElement());
    await editorRef.current?.addObject(createImageStackCustomElement());
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="website-hero"
        isPanningEnabled={false}
        isZoomingEnabled={true}
        isMoreMenuVisible={true}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
      />
    </div>
  );
}
