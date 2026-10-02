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
  editorStyle,
  hostStyle,
} from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";
import { InfoPanel, InfoPanelToggle, useInfoPanel } from "../../../components/InfoPanel";

const themes = [reactThemeLight, reactThemeDark];

export function ObjectsGroupingPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const infoPanel = useInfoPanel({ hasToolbarToggle: true });
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
      <Toolbar>
        <button onClick={() => void selectAll()}>Select All</button>
        <button onClick={() => void groupSelected()}>Group</button>
        <button onClick={() => void ungroupSelected()}>Ungroup</button>
        <InfoPanelToggle panel={infoPanel} />
      </Toolbar>
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
        <InfoPanel panel={infoPanel} width="180px">
          <h3>Objects</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {objects.map((obj) => (
              <li key={obj.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>
                {obj.__class__}
              </li>
            ))}
          </ul>
        </InfoPanel>
      </div>
    </div>
  );
}
