import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type LocaleCode } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, seedEditor, toolbarStyle } from "../../shared/demo-shared";

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
      <div style={toolbarStyle}>
        {localeOptions.map(({ code, label }) => (
          <button key={code} style={buttonStyle(locale === code)} onClick={() => setLocale(code)}>{label}</button>
        ))}
      </div>
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
