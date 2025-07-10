import "./App.css";
import { KritzelEditor, KritzelText } from "kritzel-react";

function App() {
  let editor: HTMLKritzelEditorElement | null = null;

  async function onIsReady(
    event: CustomEvent<HTMLKritzelEditorElement>
  ): Promise<void> {
    editor = event.detail;

    const text = new KritzelText({
      value: "Hello Kritzel!",
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: "#000000",
      height: 200,
      width: 200,
    });

    editor.addObject(text);
    editor.centerObjectInViewport(text);
    editor.selectObjects([text]);
  }

  return (
    <div className="app">
      <KritzelEditor onIsReady={onIsReady}></KritzelEditor>;
    </div>
  );
}

export default App;
