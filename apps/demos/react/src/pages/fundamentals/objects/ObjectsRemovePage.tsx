import { useRef, useState } from "react";
import {
  HTMLKritzelEditorElement,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelBaseObject,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ObjectsRemovePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [seedObjects] = useState<KritzelBaseObject[]>(createSeedObjects);
  const [objects, setObjects] = useState(seedObjects);
  const [workspaces] = useState(() => [new KritzelWorkspace({ objects: seedObjects })]);

  async function removeLastObject() {
    const editor = editorRef.current;
    if (!editor) return;
    const all = await editor.getAllObjects();
    const lastObject = all.at(-1);
    if (!lastObject) return;
    await editor.removeObject(lastObject);
    setObjects(await editor.getAllObjects());
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button
          style={buttonStyle(false)}
          onClick={() => void removeLastObject()}
          disabled={objects.length === 0}
        >
          Remove Object
        </button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="objects-remove"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={editorStyle}
      />
    </div>
  );
}