import { useEffect, useMemo, useRef, useState } from "react";
import {
  KritzelAgent,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelAgenticActionResult,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";
import "./chart/chart.css";

interface Row {
  id: string;
  label: string;
  value: number;
}

/** The objects of one bar on the canvas, and the slot it stands in. */
interface Bar {
  barId: string;
  labelId: string;
  slot: number;
}

const TITLE = "Coffees this week";
const INITIAL_ROWS: Row[] = [
  { id: "mon", label: "Mon", value: 4 },
  { id: "tue", label: "Tue", value: 7 },
  { id: "wed", label: "Wed", value: 3 },
  { id: "thu", label: "Thu", value: 8 },
  { id: "fri", label: "Fri", value: 5 },
];

// Chart geometry in world units: five 80-wide bars on a baseline, 30 units per coffee.
const BAR_WIDTH = 80;
const BAR_GAP = 34;
const UNIT = 30;
const BASELINE = 170;
const WIDTH = INITIAL_ROWS.length * BAR_WIDTH + (INITIAL_ROWS.length - 1) * BAR_GAP;
const LEFT = -WIDTH / 2;
const slotX = (slot: number) => LEFT + slot * (BAR_WIDTH + BAR_GAP);
/** Points every 8 units along a straight line. */
function straight(x1: number, y1: number, x2: number, y2: number) {
  const steps = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 8));
  return Array.from({ length: steps + 1 }, (_, step) => ({ x: x1 + ((x2 - x1) * step) / steps, y: y1 + ((y2 - y1) * step) / steps }));
}

const BLUE = { fillColor: "#bfdbfe", strokeColor: "#2563eb" };
const ORANGE = { fillColor: "#fed7aa", strokeColor: "#ea580c" };

/** Level 4: the app's data drives the canvas, and the agent edits what it drew instead of drawing it again. */
export function AgentsChartPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [analyst] = useState(() => new KritzelAgent({ name: "Analyst", color: "#2563EB", position: { x: 380, y: 230 } }));
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [isDrawn, setIsDrawn] = useState(false);
  const [pending, setPending] = useState(0);
  const [message, setMessage] = useState("Draw the chart, then change a value: the analyst updates just that bar.");
  const workspaces = useMemo(() => [new KritzelWorkspace({ name: "Chart Builder" })], []);
  const rowsRef = useRef(rows);
  const barsRef = useRef(new Map<string, Bar>());
  const chartIdsRef = useRef<string[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => () => timersRef.current.forEach(timer => clearTimeout(timer)), []);

  /** Runs one job of the analyst. Its actions queue up behind the ones already running. */
  async function job(fn: () => Promise<void>) {
    const editor = editorRef.current;
    if (!editor) return;
    setPending(count => count + 1);
    try {
      await editor.addAgent(analyst);
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(count => count - 1);
    }
  }

  /** The first created or changed object, or an error that says why the action did not complete. */
  function check(result: KritzelAgenticActionResult, what: string) {
    if (!result.completed) throw new Error(`The analyst could not ${what} (${result.reason}).`);
    return result.objectIds?.[0] ?? "";
  }

  function drawChart() {
    return job(async () => {
      if (chartIdsRef.current.length > 0) {
        analyst.setStatus("Clearing the old chart");
        check(await analyst.deleteObjects(chartIdsRef.current), "clear the chart");
      }
      barsRef.current.clear();
      chartIdsRef.current = [];
      await analyst.task("Drawing the chart", async () => {
        const remember = (id: string) => {
          chartIdsRef.current.push(id);
          return id;
        };
        remember(check(await analyst.createText({ x: LEFT - 20, y: BASELINE - 390, text: TITLE, style: { fontSize: 28, fontColor: "#1e293b" } }), "write the title"));
        analyst.setStatus("Drawing the axes");
        // Freehand strokes need evenly spaced points; a few corner points would be smoothed into a curve.
        const axes = [...straight(LEFT - 22, BASELINE - 330, LEFT - 22, BASELINE), ...straight(LEFT - 22, BASELINE, LEFT + WIDTH + 22, BASELINE).slice(1)];
        remember(check(await analyst.drawPath(axes, { style: { strokeColor: "#475569", strokeWidth: 3 } }), "draw the axes"));
        for (const [slot, row] of rowsRef.current.entries()) {
          analyst.setStatus(`Adding ${row.label}`);
          const height = row.value * UNIT;
          const barId = remember(
            check(
              await analyst.createShape({ x: slotX(slot), y: BASELINE - height, width: BAR_WIDTH, height, text: String(row.value), style: { ...BLUE, strokeWidth: 2, fontSize: 18 } }),
              `draw the ${row.label} bar`,
            ),
          );
          // A label is a shape without fill or outline, so its text is centered under the bar.
          const labelId = remember(
            check(
              await analyst.createShape({ x: slotX(slot), y: BASELINE + 8, width: BAR_WIDTH, height: 32, text: row.label, style: { fillColor: "transparent", strokeColor: "transparent", strokeWidth: 1, fontSize: 16 } }),
              `label ${row.label}`,
            ),
          );
          barsRef.current.set(row.id, { barId, labelId, slot });
        }
      });
      setIsDrawn(true);
      setMessage("Done. Drag a slider: the analyst resizes that bar and retypes its value.");
    });
  }

  /** Resizes one bar from its top edge and replaces the number inside it. */
  function updateBar(rowId: string) {
    return job(async () => {
      const bar = barsRef.current.get(rowId);
      const row = rowsRef.current.find(candidate => candidate.id === rowId);
      if (!bar || !row) return;
      analyst.setStatus(`Updating ${row.label}`);
      // Dragging a top corner keeps the bottom on the baseline.
      check(await analyst.resizeObject(bar.barId, { height: row.value * UNIT, handle: "top-right", keepAspectRatio: false }), `resize ${row.label}`);
      check(await analyst.typeText(bar.barId, String(row.value), { mode: "replace" }), `retype ${row.label}`);
      analyst.setStatus(null);
      setMessage(`${row.label} is now ${row.value}.`);
    });
  }

  function sortBars() {
    return job(async () => {
      const order = [...rowsRef.current].sort((a, b) => b.value - a.value);
      await analyst.task("Sorting the bars", async () => {
        for (const [slot, row] of order.entries()) {
          const bar = barsRef.current.get(row.id);
          if (!bar || bar.slot === slot) continue;
          analyst.setStatus(`Moving ${row.label}`);
          check(await analyst.moveObject(bar.barId, { x: slotX(slot), y: BASELINE - row.value * UNIT }, { align: "top-left" }), `move ${row.label}`);
          check(await analyst.moveObject(bar.labelId, { x: slotX(slot), y: BASELINE + 8 }, { align: "top-left" }), `move the ${row.label} label`);
          bar.slot = slot;
        }
      });
      setMessage(`Sorted: ${order.map(row => row.label).join(", ")}.`);
    });
  }

  function highlightTop() {
    return job(async () => {
      const max = Math.max(...rowsRef.current.map(row => row.value));
      const ids = (top: boolean) =>
        rowsRef.current.filter(row => (row.value === max) === top).map(row => barsRef.current.get(row.id)?.barId).filter((id): id is string => !!id);
      await analyst.task("Highlighting the top day", async () => {
        check(await analyst.setStyle(ids(true), ORANGE), "highlight the top day");
        const others = ids(false);
        if (others.length > 0) check(await analyst.setStyle(others, BLUE), "reset the other bars");
      });
      const top = rowsRef.current.filter(row => row.value === max).map(row => row.label);
      setMessage(`${top.join(" and ")} had the most coffee: ${max}.`);
    });
  }

  function changeValue(rowId: string, value: number) {
    setRows(current => current.map(row => (row.id === rowId ? { ...row, value } : row)));
    if (!isDrawn) return;
    // Wait until the slider rests, then let the agent update that one bar.
    clearTimeout(timersRef.current.get(rowId));
    timersRef.current.set(rowId, setTimeout(() => void updateBar(rowId), 450));
  }

  const isBusy = pending > 0;

  return (
    <div className="chart-page">
      <Toolbar>
        <span className="label">Chart Builder</span>
        <span className="status">The analyst turns the data on the right into a chart and keeps it up to date.</span>
      </Toolbar>
      <div className="chart-body">
        <KritzelEditor
          ref={editorRef}
          editorId="agents-chart"
          theme="light"
          themes={[reactThemeLight, reactThemeDark]}
          workspaces={workspaces}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          style={{ flex: 1, minWidth: 0, minHeight: 0 }}
        />
        <aside className="chart-panel" aria-label="Chart data">
          <h2>{TITLE}</h2>
          {rows.map(row => (
            <label key={row.id} className="chart-row">
              <span>{row.label}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={row.value}
                aria-label={row.label}
                onChange={event => changeValue(row.id, Number(event.target.value))}
              />
              <output>{row.value}</output>
            </label>
          ))}
          <div className="chart-buttons">
            <button className="primary" disabled={isBusy} onClick={() => void drawChart()}>{isDrawn ? "Redraw chart" : "Draw chart"}</button>
            <button disabled={!isDrawn || isBusy} onClick={() => void sortBars()}>Sort by value</button>
            <button disabled={!isDrawn || isBusy} onClick={() => void highlightTop()}>Highlight the top day</button>
          </div>
          <p className="chart-message" data-testid="chart-message" data-busy={isBusy}>{message}</p>
        </aside>
      </div>
    </div>
  );
}
