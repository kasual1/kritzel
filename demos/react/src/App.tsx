import "./App.css";
import { KritzelEditor, KritzelText } from "kritzel-react";

function App() {
  let editor: HTMLKritzelEditorElement | null = null;

  const handleGetSelectedObjects = () => {
    const selectedObjects = editor?.getSelectedObjects();
    console.log("Selected objects:", selectedObjects);
  };

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

    await editor.addObject(text);
    editor.selectObjects([text]);
  }

  return (
    <div className="app">
      <div
        style={{
          display: "flex",
          gap: "4px",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 100,
        }}
      >
        <button onClick={handleGetSelectedObjects}>Get selected objects</button>
      </div>
      <KritzelEditor onIsReady={onIsReady}></KritzelEditor>;
    </div>
  );
}

export default App;
