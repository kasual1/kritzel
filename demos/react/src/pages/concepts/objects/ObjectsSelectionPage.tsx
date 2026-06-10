import { useRef, useState } from "react";
import {
  KritzelEditor,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function ObjectsSelectionPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);

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

  async function onReady() {
    if (!editorRef.current) {
      return;
    }
    await seedEditor(editorRef.current);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void selectAll()}>Select All</button>
        <button style={buttonStyle(false)} onClick={() => void selectFirst()}>Select First</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.clearSelection().then(refreshSelection)}>Clear Selection</button>
        <button style={buttonStyle(false)} onClick={() => void refreshSelection()}>Get Selected</button>
        <span style={{ marginLeft: "auto", fontSize: "13px" }}>Selected: {selectedObjects.length}</span>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-selection"
          wheelEnabled={false}
          theme="react-theme"
          themes={[customReactTheme]}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => {
            void onReady();
          }}
          style={editorStyle}
        />
        <aside style={{ width: "220px", borderLeft: "1px solid #ebebeb", padding: "8px", overflowY: "auto", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Selected</h3>
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
