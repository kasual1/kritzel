import type { KritzelAgentToolResult, KritzelCanvasObject, KritzelCanvasSnapshot } from "@kritzel/react-editor";
import { NOTE_COLORS } from "../shared/sticky-note";
import { parseToolResult, type CopilotContent, type CopilotMessage, type CopilotModel } from "./copilot-loop";

/**
 * A scripted stand-in for Claude, so the demo works without an API key. It answers like the Messages API: it reads
 * the conversation, asks for `observe_canvas` first and plans its tool calls from the snapshot it gets back, the way
 * a model would. It only knows a few prompts, though.
 */

const THINK_TIME = 650;

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

interface Phase {
  text: string;
  calls: ToolCall[];
}

export interface CallRecord {
  name: string;
  input: Record<string, unknown>;
  result: KritzelAgentToolResult | null;
  output: string;
}

interface TurnContext {
  prompt: string;
  snapshot: KritzelCanvasSnapshot;
  records: CallRecord[];
}

interface Scenario {
  matches: (prompt: string) => boolean;
  phases: ((context: TurnContext) => Phase | null)[];
  summary: (context: TurnContext) => string;
}

export const OFFLINE_PROMPTS = [
  "Sort these notes into themes",
  "Connect the themes to a central idea",
  "Add a note for a karaoke night",
];

// ─── Board knowledge ────────────────────────────────────────────────────────

interface Theme {
  name: string;
  keywords: string[];
  color: { fill: string; stroke: string };
  font: string;
}

const THEMES: Theme[] = [
  { name: "Logistics", keywords: ["venue", "bus", "budget", "train", "hotel", "travel", "rooms"], color: NOTE_COLORS.blue, font: "#1d4ed8" },
  { name: "Activities", keywords: ["hik", "escape", "game", "karaoke", "kayak", "quiz", "walk"], color: NOTE_COLORS.green, font: "#15803d" },
  { name: "Food", keywords: ["pizza", "vegan", "coffee", "lunch", "dinner", "bbq", "snack", "breakfast"], color: NOTE_COLORS.pink, font: "#be185d" },
];

const COLUMN_WIDTH = 180;
const COLUMN_GAP = 40;
const NOTE_HEIGHT = 86;
const ROW_GAP = 14;
const HEADER_TO_NOTES = 52;

function classify(text: string): Theme | undefined {
  const lower = text.toLowerCase();
  return THEMES.find(theme => theme.keywords.some(keyword => lower.includes(keyword)));
}

/** Where the theme columns go: centered in the viewport, below room for a central idea. */
function layout(snapshot: KritzelCanvasSnapshot) {
  const { viewport } = snapshot;
  const total = THEMES.length * COLUMN_WIDTH + (THEMES.length - 1) * COLUMN_GAP;
  const left = Math.round(viewport.x + (viewport.width - total) / 2);
  const headerY = Math.round(viewport.y + 118);
  return {
    columnX: (index: number) => left + index * (COLUMN_WIDTH + COLUMN_GAP),
    headerY,
    noteY: (row: number) => headerY + HEADER_TO_NOTES + row * (NOTE_HEIGHT + ROW_GAP),
    hub: { x: Math.round(viewport.x + viewport.width / 2 - 100), y: Math.round(viewport.y + 22), width: 200, height: 64 },
  };
}

/** The user's notes: top-level shapes with text that the copilot did not create. */
function notes(snapshot: KritzelCanvasSnapshot) {
  return snapshot.objects.filter(
    object => object.type === "shape" && !!object.text && !object.parentId && object.createdBy !== snapshot.agent.id,
  );
}

function headers(snapshot: KritzelCanvasSnapshot) {
  return THEMES.map(theme => snapshot.objects.find(object => object.type === "text" && object.text?.trim() === theme.name));
}

function label(object: KritzelCanvasObject | undefined) {
  return object?.text ? `“${object.text.replace(/\s+/g, " ").trim()}”` : "a note";
}

function failures(records: CallRecord[], name: string) {
  return records.filter(record => record.name === name && record.result && !record.result.completed);
}

function describeFailure(record: CallRecord, snapshot: KritzelCanvasSnapshot) {
  const object = snapshot.objects.find(candidate => candidate.id === record.input.objectId);
  const reason = record.result?.reason;
  if (reason === "user-selected" || reason === "user-interaction") {
    return `I left ${label(object)} where it is because you're working on it.`;
  }
  return `I couldn't move ${label(object)} (${reason ?? "unknown reason"}).`;
}

// ─── Scenarios ──────────────────────────────────────────────────────────────

const sortScenario: Scenario = {
  matches: prompt => /\b(sort|group|cluster|categori[sz]e|organi[sz]e)/i.test(prompt),
  phases: [
    ({ snapshot }) => {
      const found = notes(snapshot);
      const existing = headers(snapshot);
      const { columnX, headerY } = layout(snapshot);
      const calls = THEMES.flatMap((theme, index) =>
        existing[index]
          ? []
          : [{ name: "create_text", input: { x: columnX(index), y: headerY, text: theme.name, style: { fontSize: 26, fontColor: theme.font } } }],
      );
      return {
        text: `I see ${found.length} notes about the team offsite. I'll sort them into ${THEMES.map(theme => theme.name).join(", ")}.`,
        calls,
      };
    },
    ...THEMES.map((theme, themeIndex) => ({ snapshot }: TurnContext): Phase | null => {
      const { columnX, noteY } = layout(snapshot);
      const members = notes(snapshot).filter(note => classify(note.text!) === theme);
      // Notes that are already in their slot stay where they are.
      const calls = members.flatMap((note, row) => {
        const to = { x: columnX(themeIndex), y: noteY(row) };
        if (!note.rotation && Math.abs(note.x - to.x) < 2 && Math.abs(note.y - to.y) < 2) return [];
        return [
          // Straighten first: a rotation turns around the center and would shift the top-left corner again.
          ...(note.rotation ? [{ name: "rotate_object", input: { objectId: note.id, angle: 0 } }] : []),
          { name: "move_object", input: { objectId: note.id, to, align: "top-left" } },
        ];
      });
      return calls.length > 0 ? { text: `Moving the ${theme.name.toLowerCase()} notes.`, calls } : null;
    }),
    ({ snapshot, records }) => {
      const skipped = new Set(failures(records, "move_object").map(record => record.input.objectId));
      const calls = THEMES.flatMap(theme => {
        const objectIds = notes(snapshot)
          .filter(note => classify(note.text!) === theme && !skipped.has(note.id) && note.style?.fillColor !== theme.color.fill)
          .map(note => note.id);
        return objectIds.length > 0
          ? [{ name: "set_style", input: { objectIds, style: { fillColor: theme.color.fill, strokeColor: theme.color.stroke } } }]
          : [];
      });
      return { text: "Giving every theme its own color.", calls };
    },
  ],
  summary: ({ snapshot, records }) => {
    const moved = records.filter(record => record.name === "move_object" && record.result?.completed).length;
    const failed = failures(records, "move_object");
    const unsorted = notes(snapshot).filter(note => !classify(note.text!));
    // Notes without a move call were in their slot already.
    const alreadyPlaced = notes(snapshot).length - unsorted.length - records.filter(record => record.name === "move_object").length;
    const headline =
      moved === 0 && failed.length === 0
        ? "Everything was already sorted."
        : alreadyPlaced > 0
          ? `Moved ${moved} ${moved === 1 ? "note" : "notes"} into place.`
          : `Sorted ${moved} notes into ${THEMES.length} themes.`;
    return [
      headline,
      ...failed.map(record => describeFailure(record, snapshot)),
      ...(unsorted.length > 0 ? [`${unsorted.map(label).join(", ")} didn't fit a theme, so I left it alone.`] : []),
    ].join(" ");
  },
};

const connectScenario: Scenario = {
  matches: prompt => /\b(connect|central|mind ?map|link)/i.test(prompt),
  phases: [
    ({ snapshot }) => {
      const { hub } = layout(snapshot);
      return {
        text: "I'll put the main idea above the themes and connect it to each of them.",
        calls: [
          {
            name: "create_shape",
            input: {
              shapeType: "ellipse",
              ...hub,
              text: "Team offsite",
              style: { fillColor: NOTE_COLORS.violet.fill, strokeColor: NOTE_COLORS.violet.stroke, strokeWidth: 2, fontSize: 20 },
            },
          },
        ],
      };
    },
    ({ snapshot, records }) => {
      const hubId = records.find(record => record.name === "create_shape" && record.result?.completed)?.result?.objectIds?.[0];
      if (!hubId) return null;
      const found = headers(snapshot).filter((header): header is KritzelCanvasObject => !!header);
      const targets = found.length > 0 ? found : notes(snapshot);
      return {
        text: found.length > 0 ? "Connecting the themes." : "There are no themes yet, so I'll connect the notes.",
        calls: targets.map(target => ({
          name: "connect",
          input: { from: hubId, to: target.id, style: { strokeColor: NOTE_COLORS.violet.stroke, strokeWidth: 3, arrows: { end: { enabled: true } } } },
        })),
      };
    },
  ],
  summary: ({ records }) => {
    const connected = records.filter(record => record.name === "connect" && record.result?.completed).length;
    return connected > 0 ? `Connected ${connected} ${connected === 1 ? "item" : "items"} to “Team offsite”.` : "I couldn't add the central idea.";
  },
};

const ADD_NOTE = /\badd (?:a |an )?note(?: for| about|:)?\s+(?:a |an )?(.+)/i;

const addScenario: Scenario = {
  matches: prompt => ADD_NOTE.test(prompt),
  phases: [
    ({ prompt, snapshot }) => {
      const raw = prompt.match(ADD_NOTE)![1].replace(/[.!?]+$/, "").trim();
      const text = raw.charAt(0).toUpperCase() + raw.slice(1);
      const theme = classify(text);
      const { columnX, noteY, headerY } = layout(snapshot);
      const themeIndex = theme ? THEMES.indexOf(theme) : -1;
      const sorted = !!(theme && headers(snapshot)[themeIndex]);
      let x: number;
      let y: number;
      if (sorted) {
        x = columnX(themeIndex);
        // All shapes, also the notes the copilot added before.
        const inColumn = snapshot.objects.filter(
          object => object.type === "shape" && !object.parentId && Math.abs(object.x - x) < 4 && object.y > headerY,
        );
        y = inColumn.length > 0 ? Math.max(...inColumn.map(note => note.y + note.height)) + ROW_GAP : noteY(0);
      } else {
        x = Math.round(snapshot.viewport.x + snapshot.viewport.width / 2 - COLUMN_WIDTH / 2);
        y = Math.round(snapshot.viewport.y + snapshot.viewport.height - NOTE_HEIGHT - 120);
      }
      const color = theme?.color ?? NOTE_COLORS.yellow;
      return {
        text: sorted ? `That belongs in ${theme!.name}.` : "I'll add it below the notes.",
        calls: [
          { name: "create_shape", input: { shapeType: "rectangle", x, y, width: COLUMN_WIDTH, height: NOTE_HEIGHT, text, style: { fillColor: color.fill, strokeColor: color.stroke, strokeWidth: 2, fontSize: 16 } } },
        ],
      };
    },
  ],
  summary: ({ records }) => {
    const created = records.find(record => record.name === "create_shape");
    return created?.result?.completed ? "Added the note." : `I couldn't add the note (${created?.result?.reason ?? "unknown reason"}).`;
  },
};

// Most specific first: "Connect the themes" must not count as sorting.
const SCENARIOS = [addScenario, connectScenario, sortScenario];

const HELP =
  "I'm the offline demo model, so I only know a few moves: try “Sort these notes into themes”, “Connect the themes to a central idea” or “Add a note for …”. Add a Claude API key to ask for anything.";

// ─── Conversation plumbing ──────────────────────────────────────────────────

function isPrompt(message: CopilotMessage) {
  if (message.role !== "user") return false;
  return typeof message.content === "string" || message.content.some(block => block.type === "text");
}

function promptText(message: CopilotMessage | undefined) {
  if (message?.role !== "user") return "";
  return typeof message.content === "string"
    ? message.content
    : message.content.map(block => (block.type === "text" ? block.text : "")).join(" ");
}

/** The prompt being answered and everything that happened since: the tool calls with their results. */
export function readTurn(messages: CopilotMessage[]) {
  let start = messages.length - 1;
  while (start > 0 && !isPrompt(messages[start])) start--;
  const after = messages.slice(start + 1);
  const calls = new Map<string, CallRecord>();
  let phase = -1;
  for (const message of after) {
    // System messages and plain-text turns carry no tool calls.
    if (message.role === "system" || typeof message.content === "string") continue;
    for (const block of message.content) {
      if (block.type === "tool_use") {
        calls.set(block.id, { name: block.name, input: (block.input ?? {}) as Record<string, unknown>, result: null, output: "" });
        phase = Math.max(phase, Number(/^toolu_offline_(\d+)_/.exec(block.id)?.[1] ?? -1));
      } else if (block.type === "tool_result") {
        const record = calls.get(block.tool_use_id);
        if (record) {
          record.output = typeof block.content === "string" ? block.content : "";
          record.result = parseToolResult(record.output);
        }
      }
    }
  }
  return { prompt: promptText(messages[start]), records: [...calls.values()], nextPhase: phase + 1, started: after.length > 0 };
}

let callCounter = 0;

export function reply(text: string, calls: ToolCall[] = [], phase = 0) {
  const content: CopilotContent = [];
  if (text) content.push({ type: "text", text });
  for (const call of calls) {
    content.push({ type: "tool_use", id: `toolu_offline_${phase}_${++callCounter}`, name: call.name, input: call.input });
  }
  return { content, stopReason: calls.length > 0 ? "tool_use" : "end_turn" };
}

export function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

export const offlineModel: CopilotModel = async ({ messages, signal }) => {
  await wait(THINK_TIME, signal);
  const { prompt, records, nextPhase, started } = readTurn(messages);
  const scenario = SCENARIOS.find(candidate => candidate.matches(prompt));
  if (!scenario) {
    return reply(HELP);
  }
  if (!started) {
    // Phase 0 is reserved for looking at the board, like a model that follows its system prompt.
    return reply("Let me look at the board first.", [{ name: "observe_canvas", input: {} }], 0);
  }

  const observed = records.find(record => record.name === "observe_canvas");
  let snapshot: KritzelCanvasSnapshot;
  try {
    snapshot = JSON.parse(observed?.output ?? "") as KritzelCanvasSnapshot;
  } catch {
    return reply("I couldn't read the board.");
  }
  if (!snapshot.objects) {
    return reply("I couldn't read the board.");
  }
  if (notes(snapshot).length === 0 && scenario !== addScenario) {
    return reply("The board has no notes yet. Reset it to get the sample notes back.");
  }

  const context: TurnContext = { prompt, snapshot, records };
  // Phase N of the scenario is offline phase N + 1, because phase 0 observed the board.
  for (let index = nextPhase - 1; index < scenario.phases.length; index++) {
    if (index < 0) continue;
    const phase = scenario.phases[index](context);
    if (phase && phase.calls.length > 0) {
      return reply(phase.text, phase.calls, index + 1);
    }
  }
  return reply(scenario.summary(context));
};
