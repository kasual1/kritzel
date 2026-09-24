import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
  KritzelWorkspace,
  type KritzelBaseObject,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ObjectsGroupingPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [objects, setObjects] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function refreshObjects() {
    const all = (await editorRef.current?.getAllObjects()) ?? [];
    setObjects([
      ...(all as KritzelBaseObject<HTMLElement | SVGElement>[]),
    ].sort((a, b) => a.zIndex - b.zIndex));
  }

  async function selectAll() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.selectObjects(await editor.getAllObjects());
  }

  async function groupSelected() {
    await editorRef.current?.group();
    await refreshObjects();
  }

  async function ungroupSelected() {
    await editorRef.current?.ungroup();
    await refreshObjects();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void selectAll()}>Select All</button>
        <button style={buttonStyle(false)} onClick={() => void groupSelected()}>Group</button>
        <button style={buttonStyle(false)} onClick={() => void ungroupSelected()}>Ungroup</button>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-grouping"
          theme="light"
          themes={themes}
          workspaces={workspaces}
          syncConfig={undefined}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => void refreshObjects()}
          onObjectsSelectionChange={() => void refreshObjects()}
          style={editorStyle}
        />
        <aside style={{ width: "180px", borderLeft: "1px solid #ebebeb", padding: "8px", overflowY: "auto", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Objects</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {objects.map((obj) => (
              <li key={obj.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>
                {obj.__class__}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
