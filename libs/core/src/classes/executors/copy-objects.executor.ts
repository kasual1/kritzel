import type { KritzelAgenticCopyObjectsAction } from '../../interfaces/agentic-action.interface';
import type { KritzelBaseObject } from '../objects/base-object.class';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import { KritzelLine } from '../objects/line.class';
import { prepareTopLevelTargets } from './select.executor';
import { pendingDescendants } from './add-object.executor';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { isObjectTarget, unionBox, unionCenter } from '../../helpers/agentic-geometry.helper';
import { assertObjectIds, assertTarget, uniqueIds } from '../../helpers/agentic-validation.helper';
import { KritzelZOrderHelper } from '../../helpers/z-order.helper';

/** Screen gap between the originals and their copies when `to` is not given. */
const COPY_GAP_PX = 24;

/**
 * `copyObjects`: Alt-drags the objects. The cursor presses on them, the copies appear on top of the originals,
 * like pasted objects, and are dragged so that their center lands on `to`.
 */
export const copyObjectsExecutor: KritzelAgenticActionExecutor<KritzelAgenticCopyObjectsAction> = {
  mutates: true,

  validate(action) {
    assertObjectIds(action.objectIds, 'objectIds');
    if (action.to !== undefined) {
      assertTarget(action.to, 'to');
    }
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, action.objectIds);
    if ('reason' in preparation || !action.to || !isObjectTarget(action.to)) {
      return preparation;
    }
    const reference = run.map!.findById(action.to.objectId);
    if (!reference || isSelectionObject(reference)) {
      return { reason: 'invalid-target', objectIds: [action.to.objectId] };
    }
    return { ...preparation, referenceIds: [action.to.objectId] };
  },

  async execute(run, action) {
    const ids = uniqueIds(action.objectIds);
    const map = run.map!;
    const core = run.core;
    const cursors = run.cursorManager;
    const originals = () => ids.map(id => map.findById(id)).filter((object): object is KritzelBaseObject<any> => !!object);

    const grip = unionCenter(originals());
    if (!grip) {
      run.stop('object-removed', ids);
    }
    await run.fly(grip);
    await run.press();

    const sources = originals().sort(KritzelZOrderHelper.compareStackOrder);
    const box = unionBox(sources);
    const destination = action.to
      ? cursors.resolveTarget(action.to)
      : box && { x: grip.x + box.width + COPY_GAP_PX / (core.store.state.scale || 1), y: grip.y };
    if (!destination || sources.length !== ids.length) {
      run.stop('object-removed', ids);
    }

    const copies = core.clipboardManager.createCopies(sources);
    const all = [...copies, ...copies.flatMap(copy => pendingDescendants(copy))];
    const copiedIds = new Set(all.map(object => object.id));
    for (const object of all) {
      run.own(object);
      // Dragging a whole line detaches it (as moveObject does), so a copied line lets go of objects that stay behind.
      if (object instanceof KritzelLine) {
        if (object.startAnchor && !copiedIds.has(object.startAnchor.objectId)) object.startAnchor = undefined;
        if (object.endAnchor && !copiedIds.has(object.endAnchor.objectId)) object.endAnchor = undefined;
      }
    }
    const inserted = run.mutate(() => core.clipboardManager.insertCopies(copies, 0, 0));
    inserted.forEach(object => run.track(object));
    run.display(copies.map(copy => copy.id));

    const total = { x: destination.x - grip.x, y: destination.y - grip.y };
    const scale = core.store.state.scale || 1;
    let applied = { x: 0, y: 0 };
    await run.animate(
      run.dragDuration(Math.hypot(total.x, total.y) * scale),
      (eased, _raw, isLast) => {
        const delta = { x: total.x * eased, y: total.y * eased };
        const step = { x: delta.x - applied.x, y: delta.y - applied.y };
        run.mutate(() => {
          // move() takes screen deltas and divides by the viewport scale.
          const viewportScale = core.store.state.scale || 1;
          for (const copy of copies) {
            const current = map.findById(copy.id);
            if (current) {
              current.move(step.x * viewportScale, step.y * viewportScale, 0, 0);
              core.anchorManager.updateAnchorsForObject(current.id);
            }
          }
        }, isLast ? 'final' : 'throttled');
        applied = delta;
        cursors.setPosition(run.cursorId, { x: grip.x + delta.x, y: grip.y + delta.y });
      },
      run.options.easing ?? 'ease-in-out',
    );
    await run.release();

    // Copies come in the order of their sources.
    if (copies.length === sources.length) {
      run.replaceInSelection(new Map(sources.map((source, index) => [source.id, [copies[index].id]])));
    }
    return copies.map(copy => copy.id);
  },
};
