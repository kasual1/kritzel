import { KritzelEditor } from "kritzel-react";
import { reactThemeLight } from "../../const/react-theme-light";
import { reactThemeDark } from "../../const/react-theme-dark";

export function EditorPage() {

  return (
    <div className="app">
      <KritzelEditor theme="react-theme" themes={[reactThemeLight, reactThemeDark]} />
    </div>
  );
}
