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

export function ObjectsSelectionPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function refreshSelection() {
    setSelectedObjects(
      ((await editorRef.current?.getSelectedObjects()) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[],
    );
  }

  async function selectAll() {
    const all = (await editorRef.current?.getAllObjects()) ?? [];
    await editorRef.current?.selectObjects(all);
    await refreshSelection();
  }

  async function selectFirst() {
    const all = (await editorRef.current?.getAllObjects()) ?? [];
    if (all[0]) {
      await editorRef.current?.selectObjects([all[0]]);
      await refreshSelection();
    }
  }

  async function clearSelection() {
    await editorRef.current?.clearSelection();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void selectAll()}>Select All</button>
        <button style={buttonStyle(false)} onClick={() => void selectFirst()}>Select Object</button>
        <button style={buttonStyle(false)} onClick={() => void clearSelection()}>Clear Selection</button>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-selection"
          theme="light"
          themes={themes}
          workspaces={workspaces}
          syncConfig={undefined}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onObjectsSelectionChange={() => void refreshSelection()}
          style={editorStyle}
        />
        <aside style={{ width: "220px", borderLeft: "1px solid #ebebeb", padding: "8px", overflowY: "auto", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Objects</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {selectedObjects.length === 0 && <li style={{ color: "#999", fontStyle: "italic" }}>Nothing selected</li>}
            {selectedObjects.map((obj) => (
              <li key={obj.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                <span>{obj.__class__}</span>
                <span style={{ color: "#999", fontFamily: "monospace" }}>{obj.id.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
