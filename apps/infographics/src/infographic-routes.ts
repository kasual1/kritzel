import type { ComponentType } from "react";
import { AgenticCanvasInfographic } from "./infographics/agentic-canvas/AgenticCanvasInfographic";
import { AgenticCanvasGenerativeUiInfographic } from "./infographics/agentic-canvas-generative-ui/AgenticCanvasGenerativeUiInfographic";
import { AgenticCursorsInfographic } from "./infographics/agentic-cursors/AgenticCursorsInfographic";
import { GenerativeUiInfographic } from "./infographics/generative-ui/GenerativeUiInfographic";
import { OpenSourceInfographic } from "./infographics/open-source/OpenSourceInfographic";
import { WelcomeInfographic } from "./infographics/welcome/WelcomeInfographic";

export interface InfographicRoute {
  path: string;
  title: string;
  component: ComponentType;
}

export const infographicRoutes: InfographicRoute[] = [
  { path: "/welcome", title: "Welcome", component: WelcomeInfographic },
  { path: "/open-source", title: "Open Source", component: OpenSourceInfographic },
  { path: "/agentic-canvas", title: "Agentic Canvas", component: AgenticCanvasInfographic },
  {
    path: "/agentic-canvas-generative-ui",
    title: "Agentic Canvas Generative UI",
    component: AgenticCanvasGenerativeUiInfographic,
  },
  { path: "/agentic-cursors", title: "Agentic Cursors", component: AgenticCursorsInfographic },
  { path: "/generative-ui", title: "Generative UI", component: GenerativeUiInfographic },
];
