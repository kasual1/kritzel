import { useRef, useState } from "react";
import {
  HTMLUpdrawEditorElement,
  UpdrawEditor,
  UpdrawWorkspace,
  type UpdrawBaseObject,
} from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];

export function ObjectsRemovePage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const [seedObjects] = useState<UpdrawBaseObject[]>(createSeedObjects);
  const [objects, setObjects] = useState(seedObjects);
  const [workspaces] = useState(() => [new UpdrawWorkspace({ objects: seedObjects })]);

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
      <Toolbar>
        <button
          onClick={() => void removeLastObject()}
          disabled={objects.length === 0}
        >
          Remove Object
        </button>
      </Toolbar>
      <UpdrawEditor
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