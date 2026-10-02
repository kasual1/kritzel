import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { demoRoutes } from "./demo-routes";
import { DemoIndexPage } from "./pages/DemoIndexPage";
import { WebsiteHeroPage } from "./pages/website/WebsiteHeroPage";
import { WebsiteHeroPageMobile } from "./pages/website/WebsiteHeroPageMobile";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/getting-started/quick-start" replace />} />
        <Route path="/demos" element={<DemoIndexPage />} />
        {demoRoutes.map((route) => {
          const DemoPage = route.component;
          return <Route key={route.path} path={route.path} element={<DemoPage />} />;
        })}

        <Route path="/website/hero" element={<WebsiteHeroPage />} />
        <Route path="/website/hero-mobile" element={<WebsiteHeroPageMobile />} />
        <Route path="*" element={<Navigate to="/getting-started/quick-start" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
