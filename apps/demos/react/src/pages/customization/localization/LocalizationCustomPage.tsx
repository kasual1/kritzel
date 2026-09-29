import { useRef, useState } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type KritzelLocale, type LocaleCode } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const spanishLocale: KritzelLocale = {
  code: "es",
  label: "Español",
  terms: {
    "menu.copy": "Copiar",
    "menu.cut": "Cortar",
    "menu.paste": "Pegar",
    "menu.delete": "Eliminar",
    "menu.selectAll": "Seleccionar todo",
    "menu.order": "Ordenar",
    "menu.bringToFront": "Traer al frente",
    "menu.sendToBack": "Enviar al fondo",
    "menu.settings": "Configuración",
    "menu.share": "Compartir",
    "menu.import": "Importar",
    "settings.dialogTitle": "Configuración del Editor",
    "export.dialogTitle": "Exportar Lienzo",
    "zoom.zoomIn": "Acercar",
    "zoom.zoomOut": "Alejar",
    "utility.undo": "Deshacer",
    "utility.redo": "Rehacer",
  },
};

const locales = [spanishLocale];
const themes = [reactThemeLight, reactThemeDark];

export function LocalizationCustomPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [locale, setLocale] = useState<LocaleCode>("es");

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button className={locale === "es" ? "active" : undefined} onClick={() => setLocale("es")}>Español</button>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="localization-custom"
        locales={locales}
        locale={locale}
        theme="light"
        themes={themes}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible
        isWorkspaceManagerVisible
        onIsReady={() => editorRef.current && void seedEditor(editorRef.current)}
        style={editorStyle}
      />
    </div>
  );
}
