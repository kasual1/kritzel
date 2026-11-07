import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  KritzelAgent,
  KritzelEditor,
  KritzelIframeObject,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelObjectElementClickEvent,
  type KritzelObjectElementInfo,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";
import { NOTE_COLORS } from "./shared/sticky-note";
import { CITIES, INITIAL_TRIP, tripPlannerContent, tripTotal, type TripState } from "./guided-tour/trip-planner-content";

type Phase = "idle" | "touring" | "your-turn" | "booked" | "failed";

const GUIDE = "guide";
const ACCENT = "#0EA5E9";
const WIDGET = { x: -380, y: -215, width: 340, height: 372 };
const SUMMARY = { x: 70, y: -115, width: 280, height: 150 };

interface TourStep {
  /** `data-kritzel-id` of the element inside the trip planner. */
  id: string;
  label: string;
  status: string;
  /** What pressing the element changes. Steps without it only point. */
  press?: (state: TripState) => Partial<TripState>;
  presses?: number;
}

const STEPS: TourStep[] = [
  { id: "cities", label: "Destination", status: "First, pick where to go" },
  { id: "city-lisbon", label: "Lisbon", status: "Let's try Lisbon", press: () => ({ city: "lisbon" }) },
  { id: "nights-increase", label: "Nights", status: "Stay two nights longer", press: state => ({ nights: state.nights + 1 }), presses: 2 },
  { id: "insurance", label: "Insurance", status: "Insurance is one switch", press: () => ({ insurance: true }) },
  { id: "total", label: "Total", status: "The total updates as you go" },
];

const selector = (id: string) => `[data-kritzel-id="${id}"]`;

function createWidget() {
  const widget = new KritzelIframeObject({
    name: "Trip planner",
    title: "Trip planner",
    content: tripPlannerContent,
    state: { ...INITIAL_TRIP },
    translateX: WIDGET.x,
    translateY: WIDGET.y,
    width: WIDGET.width,
    height: WIDGET.height,
    borderRadius: 16,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
  });
  widget.isRotatable = false;
  return widget;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class TourCancelled extends Error {}

const panelStyle: CSSProperties = { position: "absolute", right: 16, bottom: 84, zIndex: 20, width: "min(300px, calc(100% - 32px))", padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", boxShadow: "0 8px 24px rgba(32, 33, 36, 0.12)", boxSizing: "border-box", color: "#202124", fontFamily: "Roboto, system-ui, sans-serif", fontSize: 13, lineHeight: 1.4 };
const chipsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 };
const chipStyle: CSSProperties = { padding: "3px 8px", border: "1px solid #bae6fd", borderRadius: 999, background: "#f0f9ff", color: "#0369a1", cursor: "pointer", font: "inherit", fontSize: 12 };

export function AgentsGuidedTourPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [guide] = useState(() => new KritzelAgent({ id: GUIDE, name: "Guide", color: ACCENT, speed: 800, position: { x: -560, y: -300 } }));
  const workspaces = useMemo(() => [new KritzelWorkspace({ id: "agents-guided-tour", name: "Guided Tour" })], []);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("Press Start tour: the guide sets up an app and shows you around.");
  const [elements, setElements] = useState<KritzelObjectElementInfo[]>([]);
  const widgetIdRef = useRef<string | null>(null);
  const summaryIdRef = useRef<string | null>(null);
  // Bumped by Reset, so a running tour stops at its next step.
  const runRef = useRef(0);

  useEffect(() => () => {
    runRef.current++;
  }, []);

  const editor = () => editorRef.current!;

  function say(status: string) {
    guide.setStatus(status);
    setMessage(status);
  }

  async function widget() {
    const id = widgetIdRef.current;
    const object = id ? await editor().getObjectById<KritzelIframeObject>(id) : null;
    if (!object) throw new Error("The trip planner is gone.");
    return object;
  }

  /** Waits until the page inside the iframe reports its elements. */
  async function discoverElements(objectId: string, run: number) {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (run !== runRef.current) throw new TourCancelled();
      const found = await editor().queryObjectElements(objectId, "[data-kritzel-id]", 50);
      if (found.length > 0) return found;
      await wait(150);
    }
    throw new Error("The trip planner did not load.");
  }

  /** Points the guide's cursor at an element inside the iframe and highlights it. */
  async function pointAt(id: string, label: string, status: string) {
    const objectId = widgetIdRef.current!;
    say(status);
    await editor().highlightObjectElements(objectId, [{ selector: selector(id), label, color: ACCENT }]);
    // An element target: the cursor finds the element inside the page and sticks to it.
    await guide.moveTo({ objectId, selector: selector(id) });
  }

  /**
   * Presses an element: the cursor clicks on the object right where the element is, and the app changes the page's
   * state. Clicks of agents never reach the content of an object, so the app makes the change.
   */
  async function press(id: string, patch: (state: TripState) => Partial<TripState>) {
    const object = await widget();
    const [element] = await editor().queryObjectElements(object.id, selector(id), 1);
    if (!element) throw new Error(`"${id}" is not in the trip planner.`);
    const center = object.contentToObjectLocal({ x: element.rect.x + element.rect.width / 2, y: element.rect.y + element.rect.height / 2 });
    const result = await guide.click({ objectId: object.id, anchor: "top-left", offset: center });
    if (!result.completed) throw new Error(`The guide could not press "${id}" (${result.reason}).`);
    const state = { ...INITIAL_TRIP, ...(object.state as Partial<TripState>) };
    object.setState({ ...state, ...patch(state) });
  }

  async function act<T extends { completed: boolean; reason?: string; objectIds?: string[] }>(promise: Promise<T>, what: string) {
    const result = await promise;
    if (!result.completed) throw new Error(`The guide could not ${what} (${result.reason}).`);
    return result.objectIds ?? [];
  }

  async function clearBoard() {
    const current = editor();
    guide.cancel();
    await current.clearSelection();
    if (widgetIdRef.current) {
      await current.clearObjectElementHighlights(widgetIdRef.current).catch(() => undefined);
    }
    await current.removeAgent(guide);
    guide.setStatus(null);
    const objects = (await current.getAllObjects()).filter(
      object => object.__class__ !== "KritzelSelectionGroup" && object.__class__ !== "KritzelSelectionBox",
    );
    if (objects.length > 0) {
      await current.removeObjects(objects);
    }
    widgetIdRef.current = null;
    summaryIdRef.current = null;
    setElements([]);
  }

  async function startTour() {
    if (!editorRef.current || phase === "touring") return;
    const run = ++runRef.current;
    const check = () => {
      if (run !== runRef.current) throw new TourCancelled();
    };
    setPhase("touring");
    try {
      await clearBoard();
      await editor().addAgent(guide);
      say("Setting up a trip planner");
      await wait(400);

      // The app builds the object; the agent places it as its own change, with its cursor.
      const [widgetId] = await act(guide.addObject(createWidget()), "add the trip planner");
      widgetIdRef.current = widgetId!;
      setElements(await discoverElements(widgetId!, run));
      check();

      say("Adding a summary card");
      const [summaryId] = await act(
        guide.createShape({
          ...SUMMARY,
          text: "Trip summary",
          style: { fillColor: NOTE_COLORS.yellow.fill, strokeColor: NOTE_COLORS.yellow.stroke, strokeWidth: 2, fontSize: 16 },
        }),
        "add the summary",
      );
      summaryIdRef.current = summaryId!;
      await act(guide.connect(widgetId!, summaryId!, { style: { strokeColor: ACCENT, strokeWidth: 3, arrows: { end: { enabled: true } } } }), "connect the summary");
      check();

      for (const step of STEPS) {
        await pointAt(step.id, step.label, step.status);
        check();
        await wait(650);
        for (let count = 0; step.press && count < (step.presses ?? 1); count++) {
          await press(step.id, step.press);
          check();
          await wait(250);
        }
      }

      const trip = { ...INITIAL_TRIP, ...((await widget()).state as Partial<TripState>) };
      const city = trip.city ? CITIES[trip.city].name : "No city yet";
      say("Writing it down");
      await editor().clearObjectElementHighlights(widgetId!);
      await act(
        guide.typeText(summaryId!, `\n${city}, ${trip.nights} nights${trip.insurance ? " + insurance" : ""}\n$${tripTotal(trip).toLocaleString("en-US")}`),
        "write the summary",
      );
      check();

      // The user finishes the job: select the planner so its buttons take clicks, and point at the last one.
      await editor().highlightObjectElements(widgetId!, [{ selector: selector("book"), label: "Your turn", color: "#16A34A" }]);
      await guide.moveTo({ objectId: widgetId!, selector: selector("book"), anchor: "bottom", offset: { x: 0, y: 22 } });
      check();
      await editor().selectObjects([await widget()]);
      say("Your turn: press Book trip");
      setPhase("your-turn");
    } catch (error) {
      if (error instanceof TourCancelled || run !== runRef.current) return;
      setPhase("failed");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function onElementClick({ objectId, element }: KritzelObjectElementClickEvent) {
    if (phase !== "your-turn" || objectId !== widgetIdRef.current || element.kritzelId !== "book") return;
    const run = runRef.current;
    setPhase("booked");
    try {
      await editor().clearObjectElementHighlights(objectId);
      const trip = { ...INITIAL_TRIP, ...((await widget()).state as Partial<TripState>) };
      say("Booked! Updating the summary");
      const summaryId = summaryIdRef.current!;
      await act(guide.setStyle([summaryId], { fillColor: NOTE_COLORS.green.fill, strokeColor: NOTE_COLORS.green.stroke }), "restyle the summary");
      await act(guide.typeText(summaryId, "\n✓ Booked"), "update the summary");
      if (run !== runRef.current) return;
      say(trip.city ? `Enjoy ${CITIES[trip.city].name}!` : "All done!");
    } catch (error) {
      if (run !== runRef.current) return;
      setPhase("failed");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function pointAtElement(element: KritzelObjectElementInfo) {
    if (phase === "touring" || !widgetIdRef.current) return;
    try {
      // The list was found when the tour started; ask the page again for the element's current text.
      const [current = element] = await editor().queryObjectElements(widgetIdRef.current, element.selector, 1);
      // What a person would call the element: its accessible name, else its text.
      const name = current.attributes["aria-label"] ?? current.text ?? current.kritzelId ?? current.tagName;
      const label = name.length > 20 ? `${name.slice(0, 19)}…` : name;
      await pointAt(element.kritzelId ?? element.tagName, label, `That's “${label}”`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function reset() {
    runRef.current++;
    await clearBoard();
    setPhase("idle");
    setMessage("Press Start tour: the guide sets up an app and shows you around.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Guided Tour</span>
        <button disabled={phase === "touring"} onClick={() => void startTour()}>{phase === "idle" ? "Start tour" : "Restart tour"}</button>
        <button onClick={() => void reset()}>Reset</button>
        <span className="label" data-testid="tour-message" data-phase={phase}>{message}</span>
      </Toolbar>
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="agents-guided-tour"
          theme="light"
          themes={[reactThemeLight, reactThemeDark]}
          workspaces={workspaces}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onObjectElementClick={event => void onElementClick(event.detail)}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        {elements.length > 0 && phase !== "touring" && (
          <section aria-label="Elements in the trip planner" style={panelStyle}>
            <div style={{ fontWeight: 600 }}>The guide found {elements.length} elements</div>
            <div style={{ color: "#5f6368" }}>Pick one and the guide points at it.</div>
            <div style={chipsStyle}>
              {elements.map(element => (
                <button key={element.selector} type="button" style={chipStyle} onClick={() => void pointAtElement(element)}>
                  {element.kritzelId}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
