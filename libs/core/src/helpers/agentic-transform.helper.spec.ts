import { computeAnchoredResize, fixedCorner, normalizeAngle, rotateVector, targetRotation } from './agentic-transform.helper';
import { cumulativeLengths, polylinePrefix } from '../executors/draw-path.executor';
import { KritzelRichTextHelper } from './rich-text.helper';
import { EditorState } from 'prosemirror-state';
import { schema } from 'prosemirror-schema-basic';

describe('agentic transform helpers', () => {
  const frame = { translateX: 10, translateY: 20, width: 100, height: 50, padding: 5, scale: 2, rotation: 0 };

  it('keeps the opposite corner fixed while resizing, also when rotated', () => {
    for (const rotation of [0, Math.PI / 6, -2]) {
      for (const handle of ['top-left', 'top-right', 'bottom-right', 'bottom-left'] as const) {
        const rotated = { ...frame, rotation };
        const fixed = fixedCorner(rotated, handle);
        const step = computeAnchoredResize(rotated, handle, fixed, 240, 30);
        // Re-derive the fixed corner from the resized box: it must not move.
        const after = fixedCorner({ ...rotated, translateX: step.x, translateY: step.y, width: step.width, height: step.height }, handle);
        expect(after.x).toBeCloseTo(fixed.x, 6);
        expect(after.y).toBeCloseTo(fixed.y, 6);
      }
    }
  });

  it('returns the unchanged box and its handle for the original size', () => {
    const fixed = fixedCorner(frame, 'bottom-right');
    const step = computeAnchoredResize(frame, 'bottom-right', fixed, frame.width, frame.height);
    expect(step.x).toBeCloseTo(frame.translateX);
    expect(step.y).toBeCloseTo(frame.translateY);
    expect(step.handle.x).toBeCloseTo(frame.translateX + 110 / 2);
    expect(step.handle.y).toBeCloseTo(frame.translateY + 60 / 2);
  });

  it('rotates vectors', () => {
    const v = rotateVector(1, 0, Math.PI / 2);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
  });

  it('takes the short way round for absolute angles', () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(targetRotation((350 * Math.PI) / 180, 10, false)).toBeCloseTo((370 * Math.PI) / 180);
    expect(targetRotation(0, 270, false)).toBeCloseTo((-90 * Math.PI) / 180);
    expect(targetRotation(1, 90, true)).toBeCloseTo(1 + Math.PI / 2);
  });
});

describe('drawPath sampling', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  const lengths = cumulativeLengths(points);

  it('measures cumulative lengths', () => {
    expect(lengths).toEqual([0, 10, 20]);
  });

  it('returns the prefix up to a distance with an interpolated tip', () => {
    expect(polylinePrefix(points, lengths, 15, 0)).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }]);
    expect(polylinePrefix(points, lengths, 0, 0)).toEqual([{ x: 0, y: 0 }]);
    expect(polylinePrefix(points, lengths, 20, 0)).toEqual(points);
  });

  it('drops points closer than the minimum distance but keeps the tip', () => {
    const dense = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 10, y: 0 }];
    const prefix = polylinePrefix(dense, cumulativeLengths(dense), 10, 3);
    expect(prefix).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
  });
});

describe('KritzelRichTextHelper', () => {
  const createView = () => {
    const view = {
      state: EditorState.create({ schema }),
      dispatch(tr: any) {
        view.state = view.state.apply(tr);
      },
    };
    return view as any;
  };

  it('appends text and starts paragraphs on new lines', () => {
    const view = createView();
    KritzelRichTextHelper.appendText(view, 'Hello');
    KritzelRichTextHelper.appendText(view, ' world\nSecond');
    expect(view.state.doc.childCount).toBe(2);
    expect(view.state.doc.child(0).textContent).toBe('Hello world');
    expect(view.state.doc.child(1).textContent).toBe('Second');
  });

  it('clears the document', () => {
    const view = createView();
    KritzelRichTextHelper.appendText(view, 'a\nb');
    KritzelRichTextHelper.clear(view);
    expect(view.state.doc.childCount).toBe(1);
    expect(KritzelRichTextHelper.getText(view)).toBe('');
  });
});
