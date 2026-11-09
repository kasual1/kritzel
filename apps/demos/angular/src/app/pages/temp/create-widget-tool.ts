// TEMP: app tool of the temp command-mode demo that lets the model place HTML widgets; delete with pages/temp/.
import { formatAgentToolResult, KritzelIframeObject, type KritzelChatTool } from '@kritzel/angular-editor';

interface WidgetInput {
  name: string;
  html: string;
  css?: string;
  script?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Places a small interactive widget: model-written HTML, CSS and JavaScript in a sandboxed iframe. It is added
 * through the session's actor, so it undoes with the rest of the prompt like the canvas tools' changes.
 */
export const createWidgetTool: KritzelChatTool = {
  name: 'create_widget',
  description:
    'Places a small interactive UI widget (a counter, a timer, a poll, a mini chart, …) on the canvas: your HTML, CSS and ' +
    'JavaScript run in a sandboxed iframe with no network access and no access to the page. Write self-contained code ' +
    'with no external resources, sized to fill the widget. Returns the new object ID.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Short title shown on the widget.' },
      html: { type: 'string', description: 'Body content.' },
      css: { type: 'string', description: 'Styles.' },
      script: { type: 'string', description: 'JavaScript run after the body loads.' },
      x: { type: 'number', description: 'World x of the top-left corner.' },
      y: { type: 'number', description: 'World y of the top-left corner.' },
      width: { type: 'number', description: 'Width in world units, e.g. 320.' },
      height: { type: 'number', description: 'Height in world units, e.g. 240.' },
    },
    required: ['name', 'html', 'x', 'y', 'width', 'height'],
    additionalProperties: false,
  },
  run: async (input, { actor }) => {
    const { name, html, css = '', script = '', x, y, width, height } = input as WidgetInput;
    // The default sandbox is scripts only: never add 'allow-same-origin' to model-written code.
    const widget = new KritzelIframeObject({ name, html, css, script, translateX: x, translateY: y, width, height });
    return formatAgentToolResult(await actor.perform({ type: 'addObject', object: widget }));
  },
};
