import type { UpdrawCore } from '../core/core.class';
import type { UpdrawAgentToolResult, UpdrawCanvasElement } from '../../interfaces/agent.interface';
import type { UpdrawObjectElementInfo } from '../../interfaces/object-element.interface';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { isValidElementSelector } from '../objects/iframe-element-bridge.class';

/** Default and largest number of elements `inspect_elements` returns. */
export const INSPECT_ELEMENTS_DEFAULT_LIMIT = 50;
export const INSPECT_ELEMENTS_MAX_LIMIT = 200;

/** What `inspect_elements` looks for. */
export interface UpdrawInspectElementsOptions {
  /** CSS selector; without one, the elements a user can interact with are listed. */
  selector?: string;
  /** Maximum number of elements. */
  limit?: number;
}

/** An element as tools describe it to models: what it is, says and is like, without its geometry. */
export function toCanvasElement(info: UpdrawObjectElementInfo): UpdrawCanvasElement {
  const element: UpdrawCanvasElement = { selector: info.selector, tagName: info.tagName, visible: !!info.visibleRect };
  if (info.text) element.text = info.text;
  if (info.classList.length > 0) element.classList = info.classList;
  if (Object.keys(info.attributes).length > 0) element.attributes = info.attributes;
  if (info.state) element.state = info.state;
  if (info.value !== undefined) element.value = info.value;
  return element;
}

/**
 * Lists the elements inside an object's content for `inspect_elements`: the interactive ones, or those that
 * match a selector, with the values of form fields. Never throws: failures are tool results.
 */
export async function inspectObjectElements(core: UpdrawCore, objectId: string, options: UpdrawInspectElementsOptions = {}): Promise<UpdrawAgentToolResult> {
  const object = core.store.objects?.findById(objectId);
  if (!object || isSelectionObject(object)) {
    return {
      completed: false,
      reason: 'invalid-target',
      objectIds: [objectId],
      hint: 'Unknown ID. Call observe_canvas and use the ID of a widget (type iframe).',
    };
  }
  if (!ObjectHelper.isUpdrawElementAwareObject(object)) {
    return {
      completed: false,
      reason: 'invalid-target',
      objectIds: [objectId],
      hint: 'Only widgets (objects of type iframe) have elements. Use observe_canvas for other objects.',
    };
  }
  if (options.selector !== undefined && !isValidElementSelector(options.selector)) {
    return { completed: false, reason: 'invalid-input', message: `"selector" is not a valid CSS selector: ${options.selector}`, hint: 'Fix the input as the message says and try again.' };
  }
  const limit = Math.max(1, Math.min(INSPECT_ELEMENTS_MAX_LIMIT, Math.floor(options.limit ?? INSPECT_ELEMENTS_DEFAULT_LIMIT) || INSPECT_ELEMENTS_DEFAULT_LIMIT));
  let infos: UpdrawObjectElementInfo[];
  try {
    // One more than the limit, to tell whether there are more.
    infos = await object.queryElements(options.selector ?? '*', {
      limit: limit + 1,
      interactiveOnly: options.selector === undefined,
      includeValues: true,
    });
  } catch (error) {
    return {
      completed: false,
      reason: 'element-interaction-failed',
      objectIds: [objectId],
      message: error instanceof Error ? error.message : String(error),
      hint: object.isMounted === false
        ? 'The widget is too far outside the view to be loaded: bring it into view (fit_viewport) and try again.'
        : 'The content of the widget cannot be read right now. Try again, or tell the user if it stays like that.',
    };
  }
  const result: UpdrawAgentToolResult = { completed: true, objectIds: [objectId], elements: infos.slice(0, limit).map(toCanvasElement) };
  if (infos.length > limit) {
    result.truncated = true;
  }
  return result;
}
