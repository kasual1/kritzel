import { KritzelOverlayViewportState, KritzelViewportOverlayHelper } from './viewport-overlay.helper';

describe('KritzelViewportOverlayHelper', () => {
  const state: KritzelOverlayViewportState = {
    scale: 2,
    translateX: 10,
    translateY: 20,
    viewportWidth: 800,
    viewportHeight: 600,
  };

  describe('worldToScreen', () => {
    it('should apply scale and translation', () => {
      expect(KritzelViewportOverlayHelper.worldToScreen(state, 5, 7)).toEqual({ x: 20, y: 34 });
    });
  });

  describe('isInViewport', () => {
    it('should return true for points inside the viewport', () => {
      expect(KritzelViewportOverlayHelper.isInViewport(state, 0, 0)).toBe(true);
      expect(KritzelViewportOverlayHelper.isInViewport(state, 800, 600)).toBe(true);
    });

    it('should return false for points outside the viewport', () => {
      expect(KritzelViewportOverlayHelper.isInViewport(state, -1, 10)).toBe(false);
      expect(KritzelViewportOverlayHelper.isInViewport(state, 10, 601)).toBe(false);
    });
  });

  describe('clampToEdge', () => {
    it('should clamp a point left of the viewport to the left edge', () => {
      const result = KritzelViewportOverlayHelper.clampToEdge(state, -100, 300, 8);
      expect(result.x).toBe(8);
      expect(result.y).toBe(300);
      expect(result.edge).toBe('left');
      expect(result.angle).toBeCloseTo(Math.PI);
    });

    it('should clamp a point below the viewport to the bottom edge', () => {
      const result = KritzelViewportOverlayHelper.clampToEdge(state, 400, 1000, 8);
      expect(result.x).toBe(400);
      expect(result.y).toBe(592);
      expect(result.edge).toBe('bottom');
      expect(result.angle).toBeCloseTo(Math.PI / 2);
    });

    it('should clamp a point right of the viewport to the right edge', () => {
      const result = KritzelViewportOverlayHelper.clampToEdge(state, 2000, 300, 8);
      expect(result.x).toBe(792);
      expect(result.edge).toBe('right');
    });
  });

  describe('getInitials', () => {
    it('should return initials for multi-word names', () => {
      expect(KritzelViewportOverlayHelper.getInitials('Ada Byron Lovelace')).toBe('AL');
    });

    it('should return the first letter for single-word names', () => {
      expect(KritzelViewportOverlayHelper.getInitials('planner')).toBe('P');
    });

    it('should return single characters unchanged', () => {
      expect(KritzelViewportOverlayHelper.getInitials('x')).toBe('x');
    });
  });
});
