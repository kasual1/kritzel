import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EditorPage } from "./pages/EditorPage";
import { MultiEditorPage } from "./pages/MultiEditorPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/multi-editor" element={<MultiEditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
