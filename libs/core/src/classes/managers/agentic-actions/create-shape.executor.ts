import type { KritzelAgenticCreateShapeAction } from '../../../interfaces/agentic-action.interface';
import { KritzelShape } from '../../objects/shape.class';
import type { KritzelAgenticActionExecutor } from './agentic-action.types';
import { resolveShapeStyle } from './agentic-style.helper';
import { typeInto } from './type-text.executor';
import { AGENTIC_SHAPE_STYLE_KEYS, AGENTIC_SHAPE_TYPES, assertStyle } from './agentic-validation.helper';

function assertFinite(value: unknown, field: string, min = -Infinity): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) {
    throw new TypeError(min > -Infinity ? `"${field}" must be a number of at least ${min}.` : `"${field}" must be a number.`);
  }
}

/** `createShape`: presses at the top-left corner and drags the shape out to its size. */
export const createShapeExecutor: KritzelAgenticActionExecutor<KritzelAgenticCreateShapeAction> = {
  mutates: true,

  validate(action) {
    assertFinite(action.x, 'x');
    assertFinite(action.y, 'y');
    assertFinite(action.width, 'width', 1);
    assertFinite(action.height, 'height', 1);
    if (action.shapeType !== undefined && !AGENTIC_SHAPE_TYPES.includes(action.shapeType)) {
      throw new TypeError(`"shapeType" must be one of ${AGENTIC_SHAPE_TYPES.join(', ')}.`);
    }
    if (action.text !== undefined && typeof action.text !== 'string') {
      throw new TypeError('"text" must be a string.');
    }
    assertStyle(action.style, 'style', AGENTIC_SHAPE_STYLE_KEYS);
  },

  prepare() {
    return { targetIds: [], referenceIds: [] };
  },

  async execute(run, action) {
    const core = run.core;
    const map = run.map!;
    const cursors = run.cursorManager;
    const state = core.store.state;
    const style = resolveShapeStyle(core, action.style, action.shapeType);
    // Shapes store screen-like units: world units times their scale, as the shape tool creates them.
    const scale = state.lockDrawingScale ? 1 : state.scale || 1;
    const { x, y, width, height } = action;

    await run.fly({ x, y });
    await run.press();

    const shape = run.mutate(() => {
      const created = KritzelShape.create(core, {
        x: x * scale,
        y: y * scale,
        translateX: 0,
        translateY: 0,
        width: 1,
        height: 1,
        shapeType: style.shapeType,
        fillColor: style.fillColor,
        strokeColor: style.strokeColor,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fontColor: style.fontColor,
        scale,
      });
      run.own(created);
      core.addObject(created);
      return created;
    });
    run.track(shape);

    const distance = Math.hypot(width, height) * (state.scale || 1);
    await run.animate(
      run.dragDuration(distance),
      (eased, _raw, isLast) => {
        run.mutate(() => {
          const current = map.findById(shape.id) as KritzelShape | undefined;
          if (!current) {
            return;
          }
          current.x = x * scale;
          current.y = y * scale;
          current.width = Math.max(1, width * eased * scale);
          current.height = Math.max(1, height * eased * scale);
          current.translateX = 0;
          current.translateY = 0;
          current.updateDimensions();
          map.update(current);
        }, isLast ? 'final' : 'throttled');
        cursors.setPosition(run.cursorId, { x: x + width * eased, y: y + height * eased });
      },
      run.options.easing ?? 'ease-in-out',
    );
    await run.release();

    if (action.text) {
      const center = cursors.resolveTarget({ objectId: shape.id, anchor: 'center' });
      if (center) {
        await run.fly(center);
      }
      await run.click();
      await typeInto(run, shape.id, action.text);
    }

    run.finalAttachment = { objectId: shape.id, anchor: 'bottom-right' };
    return [shape.id];
  },
};
