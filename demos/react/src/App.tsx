import "./App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorPage } from "./pages/EditorPage";
import { MultiEditorPage } from "./pages/MultiEditorPage";
import { CustomToolbar1Page } from "./pages/CustomToolbar1Page";
import { CustomToolbar2Page } from "./pages/CustomToolbar2Page";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/e2e" replace />} />
        <Route path="/e2e" element={<EditorPage />} />
        <Route path="/e2e/multi-editor" element={<MultiEditorPage />} />
        <Route path="/examples/custom-toolbar-1" element={<CustomToolbar1Page />} />
        <Route path="/examples/custom-toolbar-2" element={<CustomToolbar2Page />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
