/** TEMP: a single agent adds one rectangle. Delete it with the rest of this folder. */
import { ShapeType } from "@kritzel/react-editor";
import { TempAgentDemo } from "./TempAgentDemos";

export function TempAgentRectanglePage() {
  return (
    <TempAgentDemo
      id="rectangle"
      title="Agent: add a rectangle"
      script={async ({ agent, step }) => {
        await step("Drawing a rectangle", () =>
          agent.createShape({ x: -100, y: -60, width: 200, height: 120, shapeType: ShapeType.Rectangle, style: { fillColor: "#fce4ec", strokeColor: "#c62828" } }),
        );
      }}
    />
  );
}
