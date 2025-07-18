import "./App.css";
import { KritzelEditor, KritzelPath } from "kritzel-react";

function App() {
  let editor: HTMLKritzelEditorElement | null = null;

  async function onIsReady(
    event: CustomEvent<HTMLKritzelEditorElement>
  ): Promise<void> {
    editor = event.detail;

     const path = new KritzelPath({
      points: [[0, 0], [100, 100]],
      translateX: 0,
      translateY: 0
    });

    editor.addObject(path);
    editor.centerObjectInViewport(path);
    editor.selectAllObjectsInViewport();
  }

  return (
    <div className="app">
      <KritzelEditor onIsReady={onIsReady}></KritzelEditor>;
    </div>
  );
}

export default App;
