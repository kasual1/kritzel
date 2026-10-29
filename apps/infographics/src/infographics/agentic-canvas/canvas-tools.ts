import type Anthropic from '@anthropic-ai/sdk';
import type { HTMLKritzelEditorElement, KritzelIframeObject } from '@kritzel/react-editor';
import { createFrame, FRAME_GAP, isFrame } from './frame';

/** Room left around the frames when the viewport moves to show them, enough to clear the titlebars and the chat box. */
const REVEAL_PADDING = 1.4;

/**
 * The tools Claude uses to change the canvas. Inputs stream eagerly, so the server does not validate them:
 * every handler checks its input before touching the canvas.
 */
export const CANVAS_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'list_frames',
    description:
      'Lists every frame on the canvas with its id, name, position in canvas units and page size in CSS pixels. ' +
      'Frames are drawn smaller than their page: canvas size = page size / scale.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_frame',
    description:
      'Creates an empty frame, a fixed-size viewport that renders one web page, and returns its id. ' +
      'Without x and y the frame is placed to the right of the existing frames. ' +
      'Common sizes: desktop 1440 wide, tablet 834 wide, phone 390 wide. Make it tall enough to show the whole page.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short title shown in the titlebar, e.g. "Landing page".' },
        width: { type: 'number', description: 'Width in CSS pixels.' },
        height: { type: 'number', description: 'Height in CSS pixels.' },
        x: { type: 'number', description: 'Left edge in canvas units.' },
        y: { type: 'number', description: 'Top edge in canvas units.' },
      },
      required: ['name', 'width', 'height'],
    },
  },
  {
    name: 'write_frame',
    description:
      'Replaces the web page a frame renders. `html` is the content of <body>, `css` the content of a <style> ' +
      'tag and `script` plain JavaScript that runs after the body. Always send the complete page, not a diff.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        frame_id: { type: 'string' },
        html: { type: 'string' },
        css: { type: 'string' },
        script: { type: 'string' },
      },
      required: ['frame_id', 'html', 'css'],
    },
  },
  {
    name: 'read_frame',
    description: 'Returns the html, css and script of a frame, to change an existing page.',
    input_schema: {
      type: 'object',
      properties: { frame_id: { type: 'string' } },
      required: ['frame_id'],
    },
  },
  {
    name: 'update_frame',
    description: 'Renames, moves or resizes a frame. Only the given properties change.',
    input_schema: {
      type: 'object',
      properties: {
        frame_id: { type: 'string' },
        name: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
      required: ['frame_id'],
    },
  },
  {
    name: 'delete_frame',
    description: 'Removes a frame from the canvas.',
    input_schema: {
      type: 'object',
      properties: { frame_id: { type: 'string' } },
      required: ['frame_id'],
    },
  },
];

type ToolInput = Record<string, unknown>;

/** Thrown for invalid tool input; its message is returned to Claude as an error result. */
export class CanvasToolError extends Error {}

function readString(input: ToolInput, key: string, isRequired: true): string;
function readString(input: ToolInput, key: string, isRequired?: false): string | undefined;
function readString(input: ToolInput, key: string, isRequired = false): string | undefined {
  const value = input[key];
  if (value === undefined && !isRequired) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new CanvasToolError(`"${key}" must be a string.`);
  }
  return value;
}

function readNumber(input: ToolInput, key: string, isRequired = false): number | undefined {
  const value = input[key];
  if (value === undefined && !isRequired) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CanvasToolError(`"${key}" must be a number.`);
  }
  return value;
}

function readSize(input: ToolInput, key: string, isRequired = false): number | undefined {
  const value = readNumber(input, key, isRequired);
  if (value !== undefined && (value < 120 || value > 8000)) {
    throw new CanvasToolError(`"${key}" must be between 120 and 8000.`);
  }
  return value;
}

/** Runs canvas tool calls against an editor. */
export class CanvasToolRunner {
  constructor(private readonly editor: HTMLKritzelEditorElement) {}

  async run(name: string, input: ToolInput): Promise<unknown> {
    switch (name) {
      case 'list_frames':
        return (await this.getFrames()).map(frame => this.describe(frame));
      case 'create_frame':
        return this.createFrame(input);
      case 'write_frame':
        return this.writeFrame(input);
      case 'read_frame': {
        const frame = await this.getFrame(readString(input, 'frame_id', true));
        return { ...this.describe(frame), ...frame.content };
      }
      case 'update_frame':
        return this.updateFrame(input);
      case 'delete_frame': {
        const frame = await this.getFrame(readString(input, 'frame_id', true));
        await this.editor.removeObject(frame);
        return { deleted: frame.id };
      }
      default:
        throw new CanvasToolError(`Unknown tool "${name}".`);
    }
  }

  async getFrames(): Promise<KritzelIframeObject[]> {
    const objects = await this.editor.getAllObjects();
    return objects.filter(isFrame);
  }

  /** Always looks the frame up again: the instance in the store can be replaced, e.g. by undo. */
  async getFrame(id: string): Promise<KritzelIframeObject> {
    const object = await this.editor.getObjectById(id);
    if (!object || !isFrame(object)) {
      throw new CanvasToolError(`There is no frame with id "${id}". Call list_frames to see the frames.`);
    }
    return object;
  }

  /** Shows the skeleton in a frame while Claude writes its page. */
  async setLoading(id: string, isLoading: boolean): Promise<void> {
    const frame = await this.editor.getObjectById(id);
    if (frame && isFrame(frame) && frame.isLoading !== isLoading) {
      frame.setLoading(isLoading);
    }
  }

  private describe(frame: KritzelIframeObject) {
    return {
      id: frame.id,
      name: frame.name ?? frame.title,
      x: Math.round(frame.translateX),
      y: Math.round(frame.translateY),
      width: Math.round(frame.width),
      height: Math.round(frame.height),
      scale: frame.scale,
    };
  }

  /** Centers the frames in the viewport, zooming out when they do not fit but never zooming in past 100 %. */
  private async reveal(frames: KritzelIframeObject[]): Promise<void> {
    const boxes = frames.map(frame => frame.boundingBox);
    const minX = Math.min(...boxes.map(box => box.x));
    const minY = Math.min(...boxes.map(box => box.y));
    const maxX = Math.max(...boxes.map(box => box.x + box.width));
    const maxY = Math.max(...boxes.map(box => box.y + box.height));
    const viewport = await this.editor.getViewport();
    const scale = Math.min(
      viewport.width / ((maxX - minX) * REVEAL_PADDING),
      viewport.height / ((maxY - minY) * REVEAL_PADDING),
      1,
    );
    await this.editor.setViewport((minX + maxX) / 2, (minY + maxY) / 2, scale);
  }

  private async createFrame(input: ToolInput) {
    const name = readString(input, 'name', true);
    const width = readSize(input, 'width', true)!;
    const height = readSize(input, 'height', true)!;
    let x = readNumber(input, 'x');
    let y = readNumber(input, 'y');

    if (x === undefined || y === undefined) {
      const frames = await this.getFrames();
      x ??= frames.length ? Math.max(...frames.map(frame => frame.translateX + frame.width / (frame.scale || 1))) + FRAME_GAP : 0;
      y ??= frames.length ? Math.min(...frames.map(frame => frame.translateY)) : 0;
    }

    // The frame shows the skeleton right away: its content is the next thing Claude writes.
    const frame = await this.editor.addObject(createFrame({ name, x, y, width, height, isLoading: true }));
    if (!frame) {
      throw new CanvasToolError('The frame could not be added.');
    }
    await this.editor.clearSelection();
    await this.reveal(await this.getFrames());
    return this.describe(frame);
  }

  private async writeFrame(input: ToolInput) {
    const frame = await this.getFrame(readString(input, 'frame_id', true));
    const html = readString(input, 'html', true);
    const css = readString(input, 'css', true);
    const script = readString(input, 'script') ?? '';
    frame.setContent({ html, css, script });
    frame.setLoading(false);
    return { written: frame.id };
  }

  private async updateFrame(input: ToolInput) {
    const frame = await this.getFrame(readString(input, 'frame_id', true));
    const name = readString(input, 'name');
    const x = readNumber(input, 'x');
    const y = readNumber(input, 'y');
    const width = readSize(input, 'width');
    const height = readSize(input, 'height');

    const changes: Partial<KritzelIframeObject> = {};
    if (name !== undefined) {
      changes.name = name;
      changes.title = name;
    }
    if (x !== undefined) changes.translateX = x;
    if (y !== undefined) changes.translateY = y;
    if (width !== undefined) changes.width = width;
    if (height !== undefined) changes.height = height;

    await this.editor.updateObject(frame, changes);
    await this.reveal(await this.getFrames());
    return this.describe(await this.getFrame(frame.id));
  }
}
