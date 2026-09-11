import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorPage } from "./pages/e2e/EditorPage";
import { EditorHocuspocusPage } from "./pages/e2e/EditorHocuspocusPage";
import { MultiEditorPage } from "./pages/e2e/MultiEditorPage";
import { WrappedEditorPage } from "./pages/e2e/WrappedEditorPage";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/e2e/editor" replace />} />
        <Route path="/e2e/editor" element={<EditorPage />} />
        <Route path="/e2e/editor-hocuspocus" element={<EditorHocuspocusPage />} />
        <Route path="/e2e/multi-editor" element={<MultiEditorPage />} />
        <Route path="/e2e/wrapped-editor" element={<WrappedEditorPage />} />
        <Route path="*" element={<Navigate to="/e2e/editor" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
