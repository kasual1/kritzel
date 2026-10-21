import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { infographicRoutes } from "./infographic-routes";

const defaultPath = infographicRoutes[0].path;

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        {infographicRoutes.map((route) => {
          const Infographic = route.component;
          return <Route key={route.path} path={route.path} element={<Infographic />} />;
        })}
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
