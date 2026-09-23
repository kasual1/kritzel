import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

export function LocalizationSwitchPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [locale, setLocale] = useState("en");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 8, padding: 8, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <strong>Locale:</strong>
        {[["en", "English"], ["de", "German"], ["fr", "French"]].map(([code, label]) => (
          <button key={code} onClick={() => setLocale(code)}>{label} ({code})</button>
        ))}
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="localization-switch"
        locale={locale}
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible
        isWorkspaceManagerVisible
        onLocaleChange={(event) => setLocale(event.detail)}
        style={{ flex: 1, minHeight: 0 }}
      />
      <div style={{ padding: 8, background: "#f5f5f5", fontFamily: "monospace" }}>Active Locale: {locale}</div>
    </div>
  );
}
