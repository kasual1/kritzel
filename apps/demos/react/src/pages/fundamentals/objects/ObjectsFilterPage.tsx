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
import { editorStyle, hostStyle } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";
import { InfoPanel, InfoPanelToggle, useInfoPanel } from "../../../components/InfoPanel";

const themes = [reactThemeLight, reactThemeDark];

export function ObjectsFilterPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const infoPanel = useInfoPanel({ hasToolbarToggle: true });
  const [results, setResults] = useState<KritzelBaseObject[]>([]);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function highlightResults(nextResults: KritzelBaseObject[]) {
    const editor = editorRef.current;
    if (!editor) return;
    const all = await editor.getAllObjects();
    await Promise.all(all.map((object) => editor.updateObject(object, { opacity: 0.5 })));
    await Promise.all(nextResults.map((object) => editor.updateObject(object, { opacity: 1 })));
  }

  async function showResults(nextResults: KritzelBaseObject[]) {
    setResults(nextResults);
    await highlightResults(nextResults);
  }

  async function queryAll() {
    const editor = editorRef.current;
    if (editor) await showResults(await editor.getAllObjects());
  }

  async function queryNone() {
    await showResults([]);
  }

  async function queryByType(className: string) {
    const editor = editorRef.current;
    if (editor) await showResults(await editor.findObjects((object) => object.__class__ === className));
  }

  async function queryInViewport() {
    const editor = editorRef.current;
    if (editor) await showResults(await editor.getObjectsInViewport());
  }

  async function onReady() {
    await highlightResults([]);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button onClick={() => void queryByType("KritzelShape")}>Shapes</button>
        <button onClick={() => void queryByType("KritzelPath")}>Paths</button>
        <button onClick={() => void queryByType("KritzelLine")}>Lines</button>
        <button onClick={() => void queryAll()}>All</button>
        <button onClick={() => void queryNone()}>None</button>
        <button onClick={() => void queryInViewport()}>In Viewport</button>
        <InfoPanelToggle panel={infoPanel} />
      </Toolbar>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-filter"
          theme="light"
          themes={themes}
          workspaces={workspaces}
          syncConfig={undefined}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => void onReady()}
          style={editorStyle}
        />
        <InfoPanel panel={infoPanel}>
          <h3>Objects</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {results.length === 0 && <li style={{ color: "#999", fontStyle: "italic" }}>No results</li>}
            {results.map((object) => (
              <li key={object.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#333", fontWeight: 500 }}>{object.__class__}</span>
                <span style={{ color: "#999", fontFamily: "monospace", fontSize: "11px" }}>{object.id.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        </InfoPanel>
      </div>
    </div>
  );
}