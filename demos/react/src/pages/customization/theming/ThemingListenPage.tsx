import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, seedEditor, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ThemingListenPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
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
      <div style={toolbarStyle}>
        <button style={buttonStyle(activeTheme === "light")} onClick={() => applyTheme("light")}>Light</button>
        <button style={buttonStyle(activeTheme === "dark")} onClick={() => applyTheme("dark")}>Dark</button>
      </div>
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
        <aside style={{ width: 220, padding: 16, borderLeft: "1px solid #e5e7eb", fontFamily: "Roboto, sans-serif" }}>
          <h3 style={{ marginTop: 0 }}>Theme changes</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {themeHistory.map((theme, index) => (
              <li key={`${theme}-${index}`} style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb", fontFamily: "monospace", fontSize: 12 }}>{theme}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}