import { UpdrawEditor } from "@updraw/react-editor";
import { reactThemeLight } from "../../const/react-theme-light";
import { reactThemeDark } from "../../const/react-theme-dark";

export function EditorPage() {

  return (
    <div className="app">
      <UpdrawEditor theme="light" themes={[reactThemeLight, reactThemeDark]} />
    </div>
  );
}
