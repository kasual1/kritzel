import {
  AGENT_TOOL_REASON_HINTS,
  KritzelIframeObject,
  formatAgentToolResult,
  type KritzelAgent,
  type KritzelAgentTool,
} from "@kritzel/react-editor";
import { widgetContent, widgetSize, type WidgetKind, type WidgetSpec } from "./widget-content";

const KINDS: WidgetKind[] = ["timer", "poll", "checklist"];

class InvalidInput extends Error {}

/** Checks what the model sent; it can send anything. */
function parse(input: unknown): WidgetSpec & { x: number; y: number } {
  const value = typeof input === "string" ? (JSON.parse(input || "{}") as unknown) : input;
  const { kind, title, x, y, minutes, items } = (value ?? {}) as Record<string, unknown>;
  if (!KINDS.includes(kind as WidgetKind)) throw new InvalidInput(`"kind" must be one of ${KINDS.join(", ")}.`);
  if (typeof title !== "string" || !title.trim() || title.length > 60) throw new InvalidInput('"title" must be a string of 1 to 60 characters.');
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) throw new InvalidInput('"x" and "y" must be numbers.');
  if (minutes !== undefined && (typeof minutes !== "number" || minutes < 1 || minutes > 120)) throw new InvalidInput('"minutes" must be a number from 1 to 120.');
  const list = items === undefined ? [] : items;
  if (!Array.isArray(list) || list.some(item => typeof item !== "string" || !item.trim() || item.length > 40)) {
    throw new InvalidInput('"items" must be a list of strings of 1 to 40 characters.');
  }
  if (kind === "poll" && (list.length < 2 || list.length > 6)) throw new InvalidInput("A poll needs 2 to 6 items (its options).");
  if (kind === "checklist" && (list.length < 1 || list.length > 8)) throw new InvalidInput("A checklist needs 1 to 8 items.");
  return { kind: kind as WidgetKind, title: title.trim(), x, y, minutes: minutes as number | undefined, items: (list as string[]).map(item => item.trim()) };
}

/**
 * An app-defined tool next to the agent's own: `addObject()` has no tool of its own, because the object comes from the
 * app. It answers like the agent's tools, with `formatAgentToolResult()` and the same hints.
 */
export function createAddWidgetTool(agent: KritzelAgent): KritzelAgentTool {
  return {
    name: "add_widget",
    description:
      "Adds a small working widget with its top-left corner at (x, y): a countdown timer, a poll the team can vote in, or a checklist. " +
      "Returns its ID, so you can connect it to the object it belongs to.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: KINDS, description: "Which widget." },
        title: { type: "string", description: "Shown at the top of the widget. A poll's title is its question." },
        x: { type: "number", description: "Left edge in world units." },
        y: { type: "number", description: "Top edge in world units." },
        minutes: { type: "number", description: "Timer only: its length, 1 to 120. Defaults to 5." },
        items: { type: "array", items: { type: "string" }, description: "Poll options (2 to 6) or checklist items (1 to 8)." },
      },
      required: ["kind", "title", "x", "y"],
      additionalProperties: false,
    },
    run: async (input, context) => {
      let spec: ReturnType<typeof parse>;
      try {
        spec = parse(input);
      } catch (error) {
        const message = error instanceof InvalidInput ? error.message : "Input is not valid JSON.";
        return formatAgentToolResult({ completed: false, reason: "invalid-input", message, hint: AGENT_TOOL_REASON_HINTS["invalid-input"] });
      }
      const widget = new KritzelIframeObject({
        name: spec.title,
        title: spec.title,
        content: widgetContent(spec),
        translateX: spec.x,
        translateY: spec.y,
        ...widgetSize(spec),
        borderRadius: 14,
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.14)",
      });
      widget.isRotatable = false;
      // The cursor hops there and the widget appears, as the agent's change with its own undo step.
      const result = await agent.addObject(widget, { signal: context?.signal ?? undefined });
      return formatAgentToolResult(result.reason ? { ...result, hint: AGENT_TOOL_REASON_HINTS[result.reason] } : result);
    },
  };
}
