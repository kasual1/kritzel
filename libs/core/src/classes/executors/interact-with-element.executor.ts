import type { KritzelAgenticInteractWithElementAction } from '../../interfaces/agentic-action.interface';
import type { KritzelAgenticElementTarget } from '../../interfaces/agentic-cursor.interface';
import type {
  KritzelElementAwareObject,
  KritzelObjectElementInteraction,
  KritzelObjectElementInteractionResult,
} from '../../interfaces/object-element.interface';
import type { KritzelAgenticActionExecutor, KritzelAgenticPreparation, KritzelAgenticRefusal } from '../../types/agentic-action.types';
import type { KritzelAgenticActionRun } from '../managers/agentic-action-run.class';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { AGENTIC_ANCHOR_FACTORS, isAgenticAnchor } from '../../helpers/agentic-geometry.helper';
import { assertElementTarget } from '../../helpers/agentic-validation.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { readElementInteraction } from '../objects/iframe-element-bridge.class';
import { KritzelAgenticAbortError } from '../agent/agentic-abort-error.class';

/** An object whose content elements can be interacted with. */
type KritzelInteractiveElementObject = KritzelElementAwareObject & Required<Pick<KritzelElementAwareObject, 'interactWithElement'>>;

/** Whether an object's content elements can be interacted with (see `KritzelElementAwareObject.interactWithElement`). */
export function isInteractiveElementObject(object: unknown): object is KritzelInteractiveElementObject {
  return ObjectHelper.isKritzelElementAwareObject(object) && typeof object.interactWithElement === 'function';
}

/** Throws a `TypeError` unless `interaction` is a valid element interaction. */
export function assertElementInteraction(interaction: unknown, field: string): asserts interaction is KritzelObjectElementInteraction {
  try {
    readElementInteraction(interaction);
  } catch (error) {
    throw new TypeError(`"${field}": ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Preparation of an action on an element: the object must exist and have elements; it is only read. */
export function prepareElementTarget(
  run: KritzelAgenticActionRun,
  target: KritzelAgenticElementTarget,
): KritzelAgenticPreparation | KritzelAgenticRefusal {
  const object = run.map!.findById(target.objectId);
  if (!object || isSelectionObject(object) || !isInteractiveElementObject(object)) {
    return { reason: 'invalid-target', objectIds: [target.objectId] };
  }
  // The content's state changes, not the object, so the object is only checked to exist (like a click).
  return { targetIds: [], referenceIds: [target.objectId], checkLevel: 'existence' };
}

/**
 * Performs an interaction with an element on behalf of an action. An agent's cursor first flies to the element
 * (after the content checked that the interaction can be performed and scrolled the element into view), presses
 * while the content performs it, and stays on the element afterwards. Actors working as the user have no cursor:
 * the interaction is performed right away. Resolves with the object's ID; stops the run with
 * `'element-interaction-failed'` when the content refuses the interaction.
 */
export async function performElementInteraction(
  run: KritzelAgenticActionRun,
  target: KritzelAgenticElementTarget,
  interaction: KritzelObjectElementInteraction,
): Promise<string[]> {
  const { objectId, selector } = target;
  const currentObject = (): KritzelInteractiveElementObject => {
    const object = run.map?.findById(objectId);
    if (!object || !isInteractiveElementObject(object)) {
      run.stop('object-removed', [objectId]);
    }
    return object;
  };
  const hasCursor = run.actorKind !== 'user';
  // An object that throws (an implementation that rejects the selector, for example) fails the action like a refusal.
  const ask = async (options?: { trial: true }): Promise<KritzelObjectElementInteractionResult> => {
    try {
      return await currentObject().interactWithElement(selector, interaction, ...(options ? [options] : []));
    } catch (error) {
      if (error instanceof KritzelAgenticAbortError) {
        throw error;
      }
      return { completed: false, reason: 'invalid-value', message: error instanceof Error ? error.message : String(error) };
    }
  };

  if (hasCursor) {
    // Tracked for the whole action, so the element's position is known when the cursor attaches to it at the end.
    // Tracking is only a nicety: an object that refuses it (e.g. too many tracked elements) still gets the interaction.
    let tracking = false;
    try {
      currentObject().trackElement(selector);
      tracking = true;
    } catch (error) {
      if (error instanceof KritzelAgenticAbortError) {
        throw error;
      }
    }
    // Through the current instance: undo, redo or a collaborator's change can replace the object meanwhile, and the
    // replacement takes the tracking over.
    run.onSettle(() => {
      const current = tracking ? run.core.store.objects?.findById(objectId) : null;
      if (ObjectHelper.isKritzelElementAwareObject(current)) {
        current.untrackElement(selector);
      }
    });
    if (run.instant) {
      // Jumps without attaching: the cursor attaches only once the interaction succeeded.
      await run.fly(target, false);
    } else {
      const trial = await ask({ trial: true });
      run.assertActive();
      if (!trial.completed) {
        failElementInteraction(run, target, trial);
      }
      await run.fly(destinationOf(currentObject(), target, trial), false);
    }
  }

  const presses = interaction.type === 'click' || interaction.type === 'check' || interaction.type === 'fill' || interaction.type === 'press';
  if (presses) {
    // The first press of a double click plays before; the content performs both clicks during the second.
    if (interaction.type === 'click' && interaction.count === 2) {
      await run.click();
    }
    await run.press();
  } else {
    run.assertActive();
    run.host.checkpoint(run);
  }
  const result = await ask();
  run.assertActive();
  // Nothing is awaited from here on: the content has acted, so the run must not end as aborted after it.
  if (presses && hasCursor) {
    run.cursorManager.setPressed(run.cursorId, false);
  }
  if (!result.completed) {
    failElementInteraction(run, target, result);
  }
  run.elementOutcome = result.element ? { element: result.element } : null;
  if (hasCursor) {
    // Attached here rather than through `finalAttachment`, which applies after the settle hooks: the action's own
    // tracking of the element must still be on, so the cursor lands on the element's known position.
    run.cursorManager.attach(run.cursorId, { objectId, selector, anchor: target.anchor ?? 'center', ...(target.offset ? { offset: target.offset } : {}) });
  }
  return [objectId];
}

/** Where the cursor flies: the target's anchor on the visible part of the element, as the trial reported it. */
function destinationOf(object: KritzelInteractiveElementObject, target: KritzelAgenticElementTarget, trial: KritzelObjectElementInteractionResult) {
  const rect = trial.element?.visibleRect ?? trial.element?.rect;
  if (!rect) {
    return { objectId: target.objectId, anchor: 'center' as const, ...(target.offset ? { offset: target.offset } : {}) };
  }
  const anchor = target.anchor ?? 'center';
  // Own keys only: an anchor from untrusted input such as "toString" must not reach Object.prototype.
  const [ax, ay] = isAgenticAnchor(anchor) ? AGENTIC_ANCHOR_FACTORS[anchor] : AGENTIC_ANCHOR_FACTORS.center;
  const local = object.contentToObjectLocal({ x: rect.x + ax * rect.width, y: rect.y + ay * rect.height });
  // Relative to the object's top-left corner, so the cursor follows the object if it moves during the flight.
  return {
    objectId: target.objectId,
    anchor: 'top-left' as const,
    offset: { x: local.x + (target.offset?.x ?? 0), y: local.y + (target.offset?.y ?? 0) },
  };
}

/** Stops the run because the content refused the interaction, keeping what it reported for the result. */
function failElementInteraction(run: KritzelAgenticActionRun, target: KritzelAgenticElementTarget, result: KritzelObjectElementInteractionResult): never {
  let message = `Element "${target.selector}": ${result.message ?? 'the interaction could not be performed.'}`;
  if (result.coveredBy) {
    message += ` It is covered by "${result.coveredBy.selector}"${result.coveredBy.text ? ` (${JSON.stringify(result.coveredBy.text)})` : ''}.`;
  }
  run.elementOutcome = {
    elementReason: result.reason ?? 'unavailable',
    message,
    ...(result.element ? { element: result.element } : {}),
  };
  run.stop('element-interaction-failed', [target.objectId]);
}

/** `interactWithElement`: performs an interaction with an element inside an object. */
export const interactWithElementExecutor: KritzelAgenticActionExecutor<KritzelAgenticInteractWithElementAction> = {
  mutates: false,

  validate(action) {
    assertElementTarget(action.target, 'target');
    assertElementInteraction(action.interaction, 'interaction');
  },

  prepare(run, action) {
    return prepareElementTarget(run, action.target);
  },

  execute(run, action) {
    return performElementInteraction(run, action.target, action.interaction);
  },
};
