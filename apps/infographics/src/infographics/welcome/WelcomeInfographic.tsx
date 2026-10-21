import { useRef, useState, type CSSProperties } from "react";
import {
  KritzelDynamicObject,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
} from "@kritzel/react-editor";
import { animateWelcomeObject, createWelcomeObject } from "./welcome-object";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

function createWorkspaces() {
  const welcome = createWelcomeObject();
  // An object occupies width / scale world units, so a larger scale makes it smaller on screen.
  welcome.scale = Math.max(
    1,
    welcome.width / Math.max(window.innerWidth - 48, 1),
    welcome.height / Math.max(window.innerHeight - 48, 1),
  );
  return [
    new KritzelWorkspace({
      id: "welcome",
      name: "Welcome",
      objects: [welcome],
    }),
  ];
}

export function WelcomeInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces] = useState(createWorkspaces);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const objects = await editor.getAllObjects();
    const welcome = objects.find(
      (object): object is KritzelDynamicObject =>
        object instanceof KritzelDynamicObject &&
        !!object.element?.querySelector('svg[aria-label="Welcome"]'),
    );
    if (!welcome) {
      return;
    }

    await editor.centerObjectInViewport(welcome);
    animateWelcomeObject(welcome);
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="infographic-welcome"
        workspaces={workspaces}
        activeWorkspaceId="welcome"
        isWorkspaceManagerVisible={false}
        onIsReady={() => void onReady()}
      />
    </div>
  );
}
