import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type LocaleCode } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";
import { InfoPanel, InfoPanelToggle, useInfoPanel } from "../../../components/InfoPanel";

const themes = [reactThemeLight, reactThemeDark];
const localeOptions: { code: LocaleCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
];

export function LocalizationListenPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const infoPanel = useInfoPanel({ hasToolbarToggle: true });
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("en");
  const [localeHistory, setLocaleHistory] = useState<LocaleCode[]>([]);

  function applyLocale(locale: LocaleCode) {
    setActiveLocale(locale);
    setLocaleHistory((history) => history.at(-1) === locale ? history : [...history, locale]);
  }

  async function onReady() {
    if (!editorRef.current) return;
    applyLocale("en");
    await seedEditor(editorRef.current);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        {localeOptions.map(({ code, label }) => <button key={code} className={activeLocale === code ? "active" : undefined} onClick={() => applyLocale(code)}>{label}</button>)}
        <InfoPanelToggle panel={infoPanel} />
      </Toolbar>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="localization-listen"
          locale={activeLocale}
          theme="light"
          themes={themes}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible
          isWorkspaceManagerVisible
          onIsReady={() => void onReady()}
          onLocaleChange={(event) => applyLocale(event.detail)}
          style={editorStyle}
        />
        <InfoPanel panel={infoPanel} width="220px">
          <h3>Locale changes</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {localeHistory.map((locale, index) => <li key={`${locale}-${index}`} style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb", fontFamily: "monospace", fontSize: 12 }}>{locale}</li>)}
          </ul>
        </InfoPanel>
      </div>
    </div>
  );
}