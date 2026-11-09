/**
 * TEMP: small checks of a single agent's canvas actions, one page per action. They live in the "Temp" category;
 * delete this folder and the "Temp" block in demo-routes.ts when they are no longer needed.
 */
import { useMemo, useRef, useState } from "react";
import {
  InMemorySyncProvider,
  KritzelAgent,
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelAgenticActionResult,
  type KritzelBaseObject,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../const/react-theme-dark";
import { reactThemeLight } from "../../const/react-theme-light";
import { editorStyle, hostStyle } from "../shared/demo-shared";
import { Toolbar } from "../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = { providers: [InMemorySyncProvider] };

/** One agent step: shows `label` on the cursor and stops the script when the action does not complete. */
type Step = (label: string, action: () => Promise<KritzelAgenticActionResult>) => Promise<string[]>;

interface ScriptContext {
  agent: KritzelAgent;
  editor: HTMLKritzelEditorElement;
  step: Step;
  /** IDs prepared by `setup`. */
  ids: Record<string, string>;
}

interface TempAgentDemoProps {
  id: string;
  title: string;
  /** Objects the workspace starts with. */
  seeds?: () => KritzelBaseObject[];
  /** Runs as the user once the editor is ready, e.g. to group seeds; returns IDs for the script. */
  setup?: (editor: HTMLKritzelEditorElement) => Promise<Record<string, string>>;
  script: (context: ScriptContext) => Promise<void>;
}

interface TimelineEntry {
  label: string;
  start: number;
  end: number;
}

declare global {
  interface Window {
    /** Steps of the last run, for recordings. */
    __tempAgentDemo?: { state: string; timeline: TimelineEntry[] };
  }
}

function shape(id: string, x: number, y: number, width: number, height: number, shapeType: ShapeType, fill: string, stroke: string): KritzelShape {
  const object = new KritzelShape({
    translateX: x,
    translateY: y,
    width,
    height,
    shapeType,
    fillColor: { light: fill, dark: fill },
    strokeColor: { light: stroke, dark: stroke },
    strokeWidth: 3,
  });
  object.id = id;
  return object;
}

const rectangle = (id = "temp-rectangle", x = -300, y = -90) => shape(id, x, y, 180, 110, ShapeType.Rectangle, "#fce4ec", "#c62828");
const ellipse = (id = "temp-ellipse", x = 60, y = -90) => shape(id, x, y, 150, 110, ShapeType.Ellipse, "#e3f2fd", "#1565c0");
const triangle = (id = "temp-triangle", x = -120, y = 80) => shape(id, x, y, 140, 110, ShapeType.Triangle, "#e8f5e9", "#2e7d32");

/** One page that runs `script` with a single agent when Run is pressed. */
export function TempAgentDemo({ id, title, seeds, setup, script }: TempAgentDemoProps) {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [agent] = useState(() => new KritzelAgent({ id: "temp-agent", name: "Agent", color: "#7C3AED", position: { x: -460, y: -250 } }));
  const [state, setState] = useState("loading");
  const [ids, setIds] = useState<Record<string, string>>({});
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: `temp-${id}`, name: title, objects: seeds?.() ?? [] })], [id, title, seeds]);

  const report = (next: string, timeline: TimelineEntry[] = window.__tempAgentDemo?.timeline ?? []) => {
    setState(next);
    window.__tempAgentDemo = { state: next, timeline };
  };

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.zoomTo(1, 0, 0);
    setIds((await setup?.(editor)) ?? {});
    await editor.addAgent(agent);
    report("ready", []);
  }

  async function run() {
    const editor = editorRef.current;
    if (!editor || state === "running") return;
    const timeline: TimelineEntry[] = [];
    report("running", timeline);
    const step: Step = async (label, action) => {
      agent.setStatus(label);
      const start = Date.now();
      const result = await action();
      timeline.push({ label, start, end: Date.now() });
      if (!result.completed) {
        throw new Error(`${label}: ${result.reason}`);
      }
      return result.objectIds ?? [];
    };
    try {
      await script({ agent, editor, step, ids });
      agent.setStatus(null);
      report("done", timeline);
    } catch (error) {
      agent.setStatus(null);
      report(`failed: ${error instanceof Error ? error.message : String(error)}`, timeline);
    }
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <span className="label">{title}</span>
        <button disabled={state !== "ready"} onClick={() => void run()}>Run</button>
        <button onClick={() => window.location.reload()}>Reset</button>
        <span className="status" data-testid="temp-demo-state">{state}</span>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId={`temp-${id}`}
        syncConfig={syncConfig}
        theme="light"
        themes={themes}
        workspaces={workspaces}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void onReady()}
        style={editorStyle}
      />
    </div>
  );
}

const twoShapes = () => [rectangle(), ellipse()];
const threeShapes = () => [rectangle(), ellipse(), triangle()];

export function TempAgentCreatePage() {
  return (
    <TempAgentDemo
      id="create"
      title="Agent: create objects"
      script={async ({ agent, step }) => {
        await step("Drawing a rectangle", () =>
          agent.createShape({ x: -380, y: -170, width: 200, height: 120, shapeType: ShapeType.Rectangle, text: "Rectangle", style: { fillColor: "#fce4ec", strokeColor: "#c62828" } }),
        );
        await step("Drawing an ellipse", () =>
          agent.createShape({ x: -100, y: -170, width: 170, height: 120, shapeType: ShapeType.Ellipse, style: { fillColor: "#e3f2fd", strokeColor: "#1565c0" } }),
        );
        await step("Writing a text", () => agent.createText({ x: 160, y: -140, text: "Hello from the agent" }));
        await step("Drawing a stroke", () =>
          agent.drawPath([{ x: -380, y: 60 }, { x: -260, y: 100 }, { x: -140, y: 50 }, { x: -20, y: 110 }, { x: 100, y: 60 }], { style: { strokeColor: "#7C3AED", strokeWidth: 4 } }),
        );
      }}
    />
  );
}

export function TempAgentMovePage() {
  return (
    <TempAgentDemo
      id="move"
      title="Agent: move objects"
      seeds={twoShapes}
      script={async ({ agent, step }) => {
        await step("Moving the rectangle", () => agent.moveObject("temp-rectangle", { x: 220, y: 110 }));
        await step("Moving the ellipse", () => agent.moveObject("temp-ellipse", { x: -260, y: 120 }));
        await step("Putting the rectangle above the ellipse", () =>
          agent.moveObject("temp-rectangle", { objectId: "temp-ellipse", anchor: "top", offset: { x: 0, y: -40 } }, { align: "bottom" }),
        );
      }}
    />
  );
}

export function TempAgentRotatePage() {
  return (
    <TempAgentDemo
      id="rotate"
      title="Agent: rotate objects"
      seeds={twoShapes}
      script={async ({ agent, step }) => {
        await step("Rotating to 45°", () => agent.rotateObject("temp-rectangle", 45));
        await step("Rotating by -60°", () => agent.rotateObject("temp-rectangle", -60, { relative: true }));
        await step("Turning the ellipse", () => agent.rotateObject("temp-ellipse", 90));
        await step("Straightening the rectangle", () => agent.rotateObject("temp-rectangle", 0));
      }}
    />
  );
}

export function TempAgentCopyPage() {
  return (
    <TempAgentDemo
      id="copy"
      title="Agent: copy objects"
      seeds={() => [rectangle("temp-rectangle", -420, -170), ellipse("temp-ellipse", 220, -170)]}
      script={async ({ agent, step }) => {
        const [copy] = await step("Copying the rectangle", () => agent.copyObjects(["temp-rectangle"]));
        const [line] = await step("Connecting the copy to the ellipse", () => agent.connect(copy, "temp-ellipse"));
        await step("Copying the pair with their line", () => agent.copyObjects([copy, "temp-ellipse", line], { to: { x: 60, y: 130 } }));
      }}
    />
  );
}

export function TempAgentGroupPage() {
  return (
    <TempAgentDemo
      id="group"
      title="Agent: group objects"
      seeds={threeShapes}
      script={async ({ agent, step }) => {
        const [group] = await step("Grouping three shapes", () => agent.groupObjects(["temp-rectangle", "temp-ellipse", "temp-triangle"]));
        await step("Moving the group", () => agent.moveObject(group, { x: 120, y: 30 }));
        await step("Rotating the group", () => agent.rotateObject(group, 15));
      }}
    />
  );
}

export function TempAgentUngroupPage() {
  return (
    <TempAgentDemo
      id="ungroup"
      title="Agent: ungroup objects"
      seeds={threeShapes}
      setup={async editor => {
        const objects = await Promise.all(["temp-rectangle", "temp-ellipse", "temp-triangle"].map(id => editor.getObjectById(id)));
        const group = await editor.group(objects.filter((object): object is KritzelBaseObject => !!object));
        return { group: group?.id ?? "" };
      }}
      script={async ({ agent, step, ids }) => {
        await step("Ungrouping", () => agent.ungroupObjects([ids.group]));
        await step("Moving the rectangle out", () => agent.moveObject("temp-rectangle", { x: -300, y: 170 }));
        await step("Moving the ellipse out", () => agent.moveObject("temp-ellipse", { x: 300, y: 170 }));
      }}
    />
  );
}

export function TempAgentOrderPage() {
  return (
    <TempAgentDemo
      id="order"
      title="Agent: order objects"
      seeds={() => [rectangle("temp-rectangle", -170, -100), ellipse("temp-ellipse", -90, -60), triangle("temp-triangle", -20, -20)]}
      script={async ({ agent, step }) => {
        await step("Bringing the rectangle to the front", () => agent.orderObjects(["temp-rectangle"], "front"));
        await step("Sending the triangle to the back", () => agent.orderObjects(["temp-triangle"], "back"));
        await step("Bringing the triangle forward", () => agent.orderObjects(["temp-triangle"], "forward"));
        await step("Sending the rectangle backward", () => agent.orderObjects(["temp-rectangle"], "backward"));
      }}
    />
  );
}

export function TempAgentResizePage() {
  return (
    <TempAgentDemo
      id="resize"
      title="Agent: resize objects"
      seeds={twoShapes}
      script={async ({ agent, step }) => {
        await step("Enlarging the rectangle", () => agent.resizeObject("temp-rectangle", { width: 300 }));
        await step("Shrinking it from the top-left corner", () => agent.resizeObject("temp-rectangle", { width: 160, height: 90, handle: "top-left" }));
        await step("Stretching the ellipse", () => agent.resizeObject("temp-ellipse", { height: 220, keepAspectRatio: false }));
      }}
    />
  );
}

export function TempAgentErasePage() {
  return (
    <TempAgentDemo
      id="erase"
      title="Agent: erase objects"
      seeds={threeShapes}
      script={async ({ agent, step }) => {
        const [stroke] = await step("Drawing a stroke", () =>
          agent.drawPath([{ x: 120, y: 90 }, { x: 200, y: 140 }, { x: 280, y: 80 }, { x: 360, y: 150 }], { style: { strokeColor: "#7C3AED", strokeWidth: 4 } }),
        );
        await step("Erasing the stroke", () => agent.deleteObjects([stroke]));
        await step("Erasing the triangle", () => agent.deleteObjects(["temp-triangle"]));
        await step("Erasing both other shapes", () => agent.deleteObjects(["temp-rectangle", "temp-ellipse"]));
      }}
    />
  );
}
