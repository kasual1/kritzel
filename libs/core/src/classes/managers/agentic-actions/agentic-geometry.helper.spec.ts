import { isPointInCorners, resolveObjectAnchor, unionCenter } from './agentic-geometry.helper';

describe('agentic geometry helpers', () => {
  const box = { x: 0, y: 0, z: 1, width: 100, height: 50 };

  it('resolves anchors with offsets', () => {
    expect(resolveObjectAnchor({ boundingBox: box }, 'bottom-right')).toEqual({ x: 100, y: 50 });
    expect(resolveObjectAnchor({ boundingBox: box }, 'top', { x: 0, y: -10 })).toEqual({ x: 50, y: -10 });
  });

  it('rotates anchors around the center', () => {
    const point = resolveObjectAnchor({ boundingBox: box, rotation: Math.PI }, 'top-left');
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(50);
  });

  it('computes the center of several boxes', () => {
    expect(
      unionCenter([
        { rotatedBoundingBox: { x: 0, y: 0, z: 1, width: 10, height: 10 } },
        { rotatedBoundingBox: { x: 90, y: 40, z: 1, width: 10, height: 10 } },
      ]),
    ).toEqual({ x: 50, y: 25 });
    expect(unionCenter([])).toBeNull();
  });

  it('tests points against rotated corners', () => {
    const diamond = [
      { x: 50, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 50 },
    ];
    expect(isPointInCorners({ x: 50, y: 50 }, diamond)).toBe(true);
    expect(isPointInCorners({ x: 5, y: 5 }, diamond)).toBe(false);
  });
});
