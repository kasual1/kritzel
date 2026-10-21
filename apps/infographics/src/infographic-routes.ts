import type { ComponentType } from "react";
import { WelcomeInfographic } from "./infographics/welcome/WelcomeInfographic";

export interface InfographicRoute {
  path: string;
  title: string;
  component: ComponentType;
}

export const infographicRoutes: InfographicRoute[] = [
  { path: "/welcome", title: "Welcome", component: WelcomeInfographic },
];
