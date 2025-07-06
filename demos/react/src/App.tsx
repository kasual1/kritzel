import './App.css'
import { KritzelEditor, KritzelText } from 'kritzel-react'

function App() {

  const kritzelEditorRef = (ref: any) => {
    if (ref) {
      const text = new KritzelText({
        value: 'Hello Kritzel!',
        translateX: 0,
        translateY: 0,
        fontSize: 24,
        fontFamily: 'Arial',
        fontColor: '#000000',
        height: 200,
        width: 200,
      });

      ref.addObject(text).then(() => {
        ref.selectObjects([text]);
      });

    }
  }


  return (
   <div>
     <button className="kritzel-editor-button" onClick={() => kritzelEditorRef(null)}>
      Reset Kritzel Editor
    </button>
     <KritzelEditor ref={kritzelEditorRef}></KritzelEditor>
   </div>
  )
}

export default App
