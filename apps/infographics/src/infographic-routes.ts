import type { ComponentType } from "react";
import { AgenticCanvasInfographic } from "./infographics/agentic-canvas/AgenticCanvasInfographic";
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
  { path: "/generative-ui", title: "Generative UI", component: GenerativeUiInfographic },
];
