import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type LocaleCode } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const localeOptions: { code: LocaleCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
];

export function LocalizationSwitchPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("en");

  return (
    <div style={hostStyle}>
      <Toolbar>
        {localeOptions.map(({ code, label }) => (
          <button key={code} className={locale === code ? "active" : undefined} onClick={() => setLocale(code)}>{label}</button>
        ))}
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="localization-switch"
        locale={locale}
        theme="light"
        themes={themes}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible
        isWorkspaceManagerVisible
        onIsReady={() => editorRef.current && void seedEditor(editorRef.current)}
        onLocaleChange={(event) => setLocale(event.detail)}
        style={editorStyle}
      />
    </div>
  );
}
