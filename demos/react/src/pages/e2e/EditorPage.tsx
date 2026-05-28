import { KritzelEditor } from "kritzel-react";
import { customReactTheme } from "../../const/custom-react-theme";

export function EditorPage() {

  return (
    <div className="app">
      <KritzelEditor theme="react-theme" themes={[customReactTheme]} />
    </div>
  );
}
