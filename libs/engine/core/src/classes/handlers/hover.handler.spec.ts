import { KritzelHoverHandler } from './hover.handler';
import { KritzelCore } from '../core/core.class';

describe('KritzelHoverHandler', () => {
  let hoverHandler: KritzelHoverHandler;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObject: {
    isHovered: boolean;
    hitTest: jest.Mock;
  };

  const createPointerEvent = (
    type: string,
    options: {
      pointerType?: string;
      clientX?: number;
      clientY?: number;
    } = {}
  ): PointerEvent => {
    return {
      pointerType: options.pointerType ?? 'mouse',
      clientX: options.clientX ?? 0,
      clientY: options.clientY ?? 0,
      type,
    } as PointerEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockObject = {
      isHovered: false,
      hitTest: jest.fn().mockReturnValue(true),
    };

    mockCore = {
      store: {
        state: {
          pointerX: 100,
          pointerY: 100,
        },
      },
      getObjectFromPointerEvent: jest.fn().mockReturnValue(mockObject),
    } as unknown as jest.Mocked<KritzelCore>;

    hoverHandler = new KritzelHoverHandler(mockCore);
  });

  describe('handlePointerMove', () => {
    describe('mouse events', () => {
      it('should get object from pointer event', () => {
        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
          clientX: 100,
          clientY: 100,
        });

        hoverHandler.handlePointerMove(event);

        expect(mockCore.getObjectFromPointerEvent).toHaveBeenCalledWith(event, '.object');
      });

      it('should set isHovered to true when hit test passes', () => {
        mockObject.hitTest.mockReturnValue(true);

        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
        });

        hoverHandler.handlePointerMove(event);

        expect(mockObject.hitTest).toHaveBeenCalledWith(100, 100);
        expect(mockObject.isHovered).toBe(true);
      });

      it('should set isHovered to false when hit test fails', () => {
        mockObject.isHovered = true;
        mockObject.hitTest.mockReturnValue(false);

        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
        });

        hoverHandler.handlePointerMove(event);

        expect(mockObject.hitTest).toHaveBeenCalledWith(100, 100);
        expect(mockObject.isHovered).toBe(false);
      });

      it('should use pointer coordinates from store state', () => {
        mockCore.store.state.pointerX = 250;
        mockCore.store.state.pointerY = 350;

        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
        });

        hoverHandler.handlePointerMove(event);

        expect(mockObject.hitTest).toHaveBeenCalledWith(250, 350);
      });

      it('should do nothing when no object found', () => {
        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(null);

        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
        });

        hoverHandler.handlePointerMove(event);

        expect(mockObject.hitTest).not.toHaveBeenCalled();
      });

      it('should do nothing when object is undefined', () => {
        (mockCore.getObjectFromPointerEvent as jest.Mock).mockReturnValue(undefined);

        const event = createPointerEvent('pointermove', {
          pointerType: 'mouse',
        });

        hoverHandler.handlePointerMove(event);

        expect(mockObject.hitTest).not.toHaveBeenCalled();
      });
    });

    describe('touch events', () => {
      it('should not process touch events', () => {
        const event = createPointerEvent('pointermove', {
          pointerType: 'touch',
        });

        hoverHandler.handlePointerMove(event);

        expect(mockCore.getObjectFromPointerEvent).not.toHaveBeenCalled();
        expect(mockObject.hitTest).not.toHaveBeenCalled();
      });
    });

    describe('pen events', () => {
      it('should not process pen events', () => {
        const event = createPointerEvent('pointermove', {
          pointerType: 'pen',
        });

        hoverHandler.handlePointerMove(event);

        expect(mockCore.getObjectFromPointerEvent).not.toHaveBeenCalled();
        expect(mockObject.hitTest).not.toHaveBeenCalled();
      });
    });
  });
});
