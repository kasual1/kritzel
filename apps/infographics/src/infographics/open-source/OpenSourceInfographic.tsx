import { PathDrawingInfographic } from "../shared/PathDrawingInfographic";
import { createOpenSourceObject } from "./open-source-object";

export function OpenSourceInfographic() {
  return <PathDrawingInfographic id="open-source" name="Open Source" createDrawing={createOpenSourceObject} duration={900} />;
}
