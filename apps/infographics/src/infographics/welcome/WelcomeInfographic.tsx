import { PathDrawingInfographic } from "../shared/PathDrawingInfographic";
import { createWelcomeObject } from "./welcome-object";

export function WelcomeInfographic() {
  return <PathDrawingInfographic id="welcome" name="Welcome" createDrawing={createWelcomeObject} />;
}
