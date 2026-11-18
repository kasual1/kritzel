import { UpmadeEditor } from "@upmade/react-editor";
import { reactThemeLight } from "../../const/react-theme-light";
import { reactThemeDark } from "../../const/react-theme-dark";

export function EditorPage() {

  return (
    <div className="app">
      <UpmadeEditor theme="light" themes={[reactThemeLight, reactThemeDark]} />
    </div>
  );
}
