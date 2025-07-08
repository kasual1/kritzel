import { useRef, useEffect } from "react";
import "./App.css";
import { KritzelEditor, KritzelText } from "kritzel-react";

function App() {
  const kritzelEditorRef = useRef<any>(null);

  useEffect(() => {
    const initializeEditor = async () => {
      if (kritzelEditorRef.current) {
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

        await kritzelEditorRef.current.addObject(text);
        kritzelEditorRef.current.selectObjects([text]);
      }
    };

    initializeEditor();
  }, []); 

  const handleGetSelectedObjects = () => {
    if (kritzelEditorRef.current) {
      const selectedObjects = kritzelEditorRef.current.getSelectedObjects();
      console.log("Selected objects:", selectedObjects);
    }
  }

  return (
    <div className="app">
      <div style={{ display: 'flex', gap: '4px', position: 'absolute', top: 0, left: 0, zIndex: 100}}></div>
      <button
        onClick={handleGetSelectedObjects}
      >
        Get selected objects
      </button>
      <KritzelEditor ref={kritzelEditorRef}></KritzelEditor>;
    </div>
  );
}

export default App;
