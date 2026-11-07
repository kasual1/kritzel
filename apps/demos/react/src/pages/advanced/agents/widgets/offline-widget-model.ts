import type { KritzelCanvasObject, KritzelCanvasSnapshot } from "@kritzel/react-editor";
import type { CopilotModel } from "../copilot/copilot-loop";
import { readTurn, reply, wait, type CallRecord, type ToolCall } from "../copilot/offline-model";
import type { WidgetKind, WidgetSpec } from "./widget-content";

/**
 * A scripted stand-in for Claude in the widget builder. It looks at the board, decides which widget fits the prompt,
 * places it next to the object the prompt is about and connects the two, with the same tools Claude gets.
 */

export const WIDGET_PROMPTS = [
  "Add a 5-minute timer for the standup",
  "Turn the retro ideas into a checklist",
  "Add a poll: Where should we eat? Pizza, Sushi, Tacos",
];

/** How the page tells the model which object is selected. */
export const SELECTION_PREFIX = "Selected object:";

const HELP =
  "I'm the offline demo model, so I only build timers, polls and checklists: try one of the suggestions. Add a Claude API key to ask for anything.";

function lines(object: KritzelCanvasObject | undefined) {
  return (object?.text ?? "").split("\n").map(line => line.trim()).filter(Boolean);
}

function kindOf(prompt: string): WidgetKind | null {
  if (/\b(timer|countdown|pomodoro)\b/i.test(prompt)) return "timer";
  if (/\b(poll|vote)\b/i.test(prompt)) return "poll";
  if (/\b(checklist|to-?do|tasks?)\b/i.test(prompt)) return "checklist";
  return null;
}

/** The object the prompt is about: the selected one, else a note whose text shares a word with the prompt. */
function targetOf(prompt: string, snapshot: KritzelCanvasSnapshot) {
  const selected = new RegExp(`${SELECTION_PREFIX} (\\S+)`).exec(prompt)?.[1];
  const notes = snapshot.objects.filter(object => object.type === "shape" && object.text && !object.parentId);
  if (selected) return notes.find(note => note.id === selected);
  const words = prompt.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  return notes.find(note => words.some(word => note.text!.toLowerCase().includes(word)));
}

function specOf(kind: WidgetKind, prompt: string, target: KritzelCanvasObject | undefined): WidgetSpec {
  const [title, ...rest] = lines(target);
  const ask = prompt.split(SELECTION_PREFIX)[0];
  switch (kind) {
    case "timer":
      return { kind, title: title ?? "Timer", minutes: Number(/(\d+)\s*-?\s*min/i.exec(ask)?.[1] ?? 5) };
    case "poll": {
      const question = /(?:poll|vote)\s*[:\-–]?\s*([^?]+\?)/i.exec(ask)?.[1]?.trim() ?? "What do you think?";
      const options = (ask.split("?")[1] ?? "").split(/,|\bor\b/).map(option => option.replace(/[.!]+$/, "").trim()).filter(Boolean);
      return { kind, title: question.charAt(0).toUpperCase() + question.slice(1), items: options.length >= 2 ? options.slice(0, 6) : ["Yes", "No"] };
    }
    case "checklist": {
      const items = rest.length > 0 ? rest : (ask.split(":")[1] ?? "").split(",").map(item => item.trim()).filter(Boolean);
      return { kind, title: title ?? "Checklist", items: (items.length > 0 ? items : ["First step"]).slice(0, 8) };
    }
  }
}

/** Right of the target, or right of everything near the top of the view. */
function placeFor(snapshot: KritzelCanvasSnapshot, target: KritzelCanvasObject | undefined) {
  if (target) return { x: Math.round(target.x + target.width + 50), y: Math.round(target.y) };
  const top = snapshot.viewport.y + 80;
  const right = Math.max(snapshot.viewport.x + 40, ...snapshot.objects.filter(object => !object.parentId && object.y < top + 240).map(object => object.x + object.width));
  return { x: Math.round(right + 50), y: Math.round(top) };
}

function describe(spec: WidgetSpec) {
  switch (spec.kind) {
    case "timer":
      return `a ${spec.minutes}-minute timer`;
    case "poll":
      return `a poll with ${spec.items!.length} options`;
    case "checklist":
      return `a checklist with ${spec.items!.length} items`;
  }
}

function created(records: CallRecord[]) {
  return records.find(record => record.name === "add_widget" && record.result?.completed)?.result?.objectIds?.[0];
}

export const offlineWidgetModel: CopilotModel = async ({ messages, signal }) => {
  await wait(650, signal);
  const { prompt, records, nextPhase, started } = readTurn(messages);
  const kind = kindOf(prompt.split(SELECTION_PREFIX)[0]);
  if (!kind) return reply(HELP);
  if (!started) return reply("Let me look at the board first.", [{ name: "observe_canvas", input: {} }], 0);

  let snapshot: KritzelCanvasSnapshot;
  try {
    snapshot = JSON.parse(records.find(record => record.name === "observe_canvas")?.output ?? "") as KritzelCanvasSnapshot;
  } catch {
    return reply("I couldn't read the board.");
  }
  const target = targetOf(prompt, snapshot);
  const spec = specOf(kind, prompt, target);
  const about = target ? ` next to “${lines(target)[0]}”` : "";

  if (nextPhase === 1) {
    const calls: ToolCall[] = [{ name: "add_widget", input: { ...spec, ...placeFor(snapshot, target) } }];
    return reply(`I'll add ${describe(spec)}${about}.`, calls, 1);
  }
  const widgetId = created(records);
  if (nextPhase === 2 && widgetId && target) {
    return reply("Connecting it to the note.", [{ name: "connect", input: { from: target.id, to: widgetId, style: { strokeColor: "#94a3b8", strokeWidth: 2, arrows: { end: { enabled: true } } } } }], 2);
  }
  if (!widgetId) {
    const failed = records.find(record => record.name === "add_widget")?.result;
    return reply(`I couldn't add the widget (${failed?.reason ?? "unknown reason"}).`);
  }
  const tryIt = { timer: "press Start", poll: "vote", checklist: "tick items off" }[spec.kind];
  return reply(`Added ${describe(spec)}${about}${target ? " and connected them" : ""}. It works right away: select it and ${tryIt}.`);
};
