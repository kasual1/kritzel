import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { demoRoutes } from "./demo-routes";
import { DemoIndexPage } from "./pages/DemoIndexPage";
import { GenerativeUi } from "./pages/temp/GenerativeUi"; // TEMP: delete with pages/temp/

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/getting-started/quick-start" replace />} />
        <Route path="/demos" element={<DemoIndexPage />} />
        {/* TEMP: delete with pages/temp/ */}
        <Route path="/temp/agentic-canvas" element={<GenerativeUi />} />
        {demoRoutes.map((route) => {
          const DemoPage = route.component;
          return <Route key={route.path} path={route.path} element={<DemoPage />} />;
        })}

        <Route path="*" element={<Navigate to="/getting-started/quick-start" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
