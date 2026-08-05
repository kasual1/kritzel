import { KritzelEditor } from "kritzel-react";
import { reactThemeLight } from "../../const/react-theme-light";

export function EditorPage() {

  return (
    <div className="app">
      <KritzelEditor theme="react-theme" themes={[reactThemeLight]} />
    </div>
  );
}
