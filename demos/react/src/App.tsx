import "./App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorPage } from "./pages/e2e/EditorPage";
import { MultiEditorPage } from "./pages/e2e/MultiEditorPage";
import { CustomToolbar1Page } from "./pages/examples/CustomToolbar1Page";
import { CustomToolbar2Page } from "./pages/examples/CustomToolbar2Page";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/e2e/editor" replace />} />
        <Route path="/e2e/editor" element={<EditorPage />} />
        <Route path="/e2e/multi-editor" element={<MultiEditorPage />} />
        <Route path="/examples/custom-toolbar-1" element={<CustomToolbar1Page />} />
        <Route path="/examples/custom-toolbar-2" element={<CustomToolbar2Page />} />
        <Route path="*" element={<Navigate to="/e2e/editor" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
