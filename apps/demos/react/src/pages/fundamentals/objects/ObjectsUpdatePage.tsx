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

export function ObjectsUpdatePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [selected, setSelected] = useState<KritzelBaseObject | null>(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function refreshSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = await editor.getSelectedObjects();
    setSelected(selection[0] ?? null);
    setSelectionCount(selection.length);
  }

  async function selectFirst() {
    const editor = editorRef.current;
    if (!editor) return;
    const all = await editor.getAllObjects();
    if (all[0]) await editor.selectObjects([all[0]]);
  }

  async function updateSelected(properties: Partial<KritzelBaseObject>) {
    const editor = editorRef.current;
    if (!editor || !selected) return;
    const updated = await editor.updateObject(selected, properties);
    if (updated) await editor.selectObjects([updated]);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void selectFirst()}>Select Object</button>
        <span style={{ width: "1px", height: "24px", background: "#d9d9d9" }} />
        <button
          style={buttonStyle(false)}
          disabled={selectionCount !== 1}
          onClick={() => void updateSelected({ translateX: (selected?.translateX ?? 0) + 40 })}
        >
          Move Right
        </button>
        <button
          style={buttonStyle(false)}
          disabled={selectionCount !== 1}
          onClick={() => void updateSelected({ rotation: ((selected?.rotation ?? 0) + 15) % 360 })}
        >
          Rotate 15°
        </button>
        <button
          style={buttonStyle(false)}
          disabled={selectionCount !== 1}
          onClick={() => void updateSelected({ opacity: selected?.opacity === 1 ? 0.4 : 1 })}
        >
          Toggle Opacity
        </button>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-update"
          theme="light"
          themes={themes}
          workspaces={workspaces}
          syncConfig={undefined}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => void refreshSelection()}
          onObjectsSelectionChange={() => void refreshSelection()}
          style={editorStyle}
        />
        <aside style={{ width: "180px", borderLeft: "1px solid #ebebeb", padding: "8px", overflowY: "auto", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Object</h3>
          {selected ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {[
                ["translateX", selected.translateX.toFixed(0)],
                ["translateY", selected.translateY.toFixed(0)],
                ["rotation", selected.rotation.toFixed(0)],
                ["opacity", selected.opacity.toFixed(1)],
              ].map(([label, value]) => (
                <li key={label} style={{ padding: "4px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#333", fontWeight: 500 }}>{label}</span>
                  <span style={{ color: "#999", fontFamily: "monospace", fontSize: "11px" }}>{value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#999", fontStyle: "italic" }}>Nothing selected</p>
          )}
        </aside>
      </div>
    </div>
  );
}