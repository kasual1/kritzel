import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";
import { InfoPanel, InfoPanelToggle, useInfoPanel } from "../../../components/InfoPanel";

const themes = [reactThemeLight, reactThemeDark];

export function ThemingListenPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const infoPanel = useInfoPanel({ hasToolbarToggle: true });
  const [activeTheme, setActiveTheme] = useState("light");
  const [themeHistory, setThemeHistory] = useState<string[]>([]);

  function applyTheme(theme: string) {
    setActiveTheme(theme);
    setThemeHistory((history) => history.at(-1) === theme ? history : [...history, theme]);
  }

  async function onReady() {
    if (!editorRef.current) return;
    applyTheme("light");
    await seedEditor(editorRef.current);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button className={activeTheme === "light" ? "active" : undefined} onClick={() => applyTheme("light")}>Light</button>
        <button className={activeTheme === "dark" ? "active" : undefined} onClick={() => applyTheme("dark")}>Dark</button>
        <InfoPanelToggle panel={infoPanel} />
      </Toolbar>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="theming-listen"
          theme={activeTheme}
          themes={themes}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible
          isWorkspaceManagerVisible
          onIsReady={() => void onReady()}
          onThemeChange={(event) => applyTheme(event.detail)}
          style={editorStyle}
        />
        <InfoPanel panel={infoPanel} width="220px">
          <h3>Theme changes</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {themeHistory.map((theme, index) => (
              <li key={`${theme}-${index}`} style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb", fontFamily: "monospace", fontSize: 12 }}>{theme}</li>
            ))}
          </ul>
        </InfoPanel>
      </div>
    </div>
  );
}