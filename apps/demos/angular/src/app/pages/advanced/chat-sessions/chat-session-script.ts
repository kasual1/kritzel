import { createScriptedTransport, type KritzelChatRequest, type KritzelScriptedAnswer } from '@kritzel/angular-editor';

/** A prompt containing this phrase takes long to answer, so the stop button can be tried. */
export const SLOW_PHRASE = 'think slowly';

/** The text of the newest user message. */
function lastPrompt(request: KritzelChatRequest): string {
  const user = [...request.messages].reverse().find(message => message.role === 'user');
  return user?.parts.map(part => (part.type === 'text' ? part.text : '')).join('\n') ?? '';
}

/** IDs of the objects the prompt's chips refer to. */
function referencedIds(prompt: string): string[] {
  return Array.from(prompt.matchAll(/objectId: ([^,)\s]+)/g), match => match[1]);
}

/**
 * Stands in for a model: a prompt about selected objects (chips) restyles them, any other prompt adds a note
 * with the prompt as its text. A real app sends the request to its server instead.
 */
export function createDemoTransport() {
  let notes = 0;
  return createScriptedTransport((request): string | KritzelScriptedAnswer => {
    const last = request.messages[request.messages.length - 1];
    if (last.role === 'tool') {
      return request.mode === 'agent' ? "Done. Undo it with the agent's history." : 'Done. Press Ctrl+Z to take it back.';
    }
    const prompt = lastPrompt(request);
    if (prompt.includes(SLOW_PHRASE)) {
      return { text: 'That took a while.', delayMs: 8000 };
    }
    const ids = referencedIds(prompt);
    if (ids.length > 0) {
      return { text: 'Restyling the selection.', toolCalls: [{ tool: 'set_style', input: { objectIds: ids, style: { fillColor: '#fde68a' } } }], delayMs: 400 };
    }
    const index = notes++;
    const text = prompt.split('\n')[0].slice(0, 60);
    return {
      text: 'Adding a note.',
      toolCalls: [{ tool: 'create_shape', input: { x: -260 + (index % 3) * 180, y: 160 + Math.floor(index / 3) * 110, width: 160, height: 80, text } }],
      delayMs: 400,
    };
  });
}
