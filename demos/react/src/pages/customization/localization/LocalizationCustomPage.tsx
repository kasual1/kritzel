import { useState } from "react";
import { KritzelEditor, type KritzelLocale } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

const spanishLocale: KritzelLocale = {
  code: "es",
  label: "Espanol",
  terms: {
    "menu.copy": "Copiar",
    "menu.cut": "Cortar",
    "menu.paste": "Pegar",
    "menu.delete": "Eliminar",
    "menu.settings": "Configuracion",
    "menu.share": "Compartir",
    "settings.dialogTitle": "Configuracion del editor",
    "zoom.zoomIn": "Acercar",
    "zoom.zoomOut": "Alejar",
    "utility.undo": "Deshacer",
    "utility.redo": "Rehacer",
  },
};

export function LocalizationCustomPage() {
  const [locale, setLocale] = useState("es");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 8, padding: 8, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <strong>Custom Locale:</strong>
        <button onClick={() => setLocale("es")}>Espanol (es)</button>
        <button onClick={() => setLocale("en")}>English (en)</button>
      </div>
      <KritzelEditor
        editorId="localization-custom"
        locales={[spanishLocale]}
        locale={locale}
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible
        isWorkspaceManagerVisible
        style={{ flex: 1, minHeight: 0 }}
      />
      <div style={{ padding: 8, background: "#f5f5f5", fontFamily: "monospace" }}>Active Locale: {locale}</div>
    </div>
  );
}
