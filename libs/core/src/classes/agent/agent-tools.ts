import type { UpmadeAgentTool, UpmadeAgentToolsOptions } from '../../interfaces/agent.interface';
import { bindCanvasTool, isCanvasToolOffered, type UpmadeCanvasToolEnv, type UpmadeToolActor } from './canvas-tool';
import { UPMADE_CANVAS_TOOLS } from './canvas-tool-definitions';

export { AGENT_TOOL_REASON_HINTS, formatAgentToolResult, type UpmadeToolActor } from './canvas-tool';
export { MODEL_IFRAME_CONTENT_SECURITY_POLICY } from './canvas-tool-definitions';

/**
 * Creates the provider-neutral tools of an actor from the canvas tool definitions (`UPMADE_CANVAS_TOOLS`):
 * those offered to the actor's kind and enabled by the options, filtered by `only` and renamed by `prefix`.
 * Each tool is a self-contained object (its `run` works when copied, as tool runners do) and never throws for
 * mistakes of the model. An actor working as the user gets no `click`, `select`, `clear_selection`, `undo` or
 * `redo`, and descriptions written for working as the user.
 */
export function createActorTools(actor: UpmadeToolActor, options: UpmadeAgentToolsOptions = {}): UpmadeAgentTool[] {
  const env: UpmadeCanvasToolEnv = { kind: actor.kind === 'user' ? 'user' : 'agent', options };
  const prefix = options.prefix ?? '';
  const only = options.only ? new Set(options.only.map(name => (prefix && name.startsWith(prefix) ? name.slice(prefix.length) : name))) : null;
  return UPMADE_CANVAS_TOOLS.filter(definition => isCanvasToolOffered(definition, env) && (!only || only.has(definition.name))).map(definition =>
    bindCanvasTool(actor, definition, options),
  );
}

/** The tools of an agent (`agent.tools()`). */
export function createAgentTools(agent: UpmadeToolActor, options: UpmadeAgentToolsOptions = {}): UpmadeAgentTool[] {
  return createActorTools(agent, options);
}
