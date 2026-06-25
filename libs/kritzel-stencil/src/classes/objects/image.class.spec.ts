import { KritzelImage } from './image.class';
import { KritzelCore } from '../core/core.class';

describe('KritzelImage', () => {
  let imageObject: KritzelImage;
  let mockCore: jest.Mocked<KritzelCore>;
  let mockObjectsUpdate: jest.Mock;

  const createMockCore = (): jest.Mocked<KritzelCore> => {
    const objectsUpdate = jest.fn();
    mockObjectsUpdate = objectsUpdate;

    return {
      store: {
        state: {
          scale: 1,
          translateX: 0,
          translateY: 0,
          viewportWidth: 1000,
          viewportHeight: 800,
          objects: {
            update: objectsUpdate,
          },
          activeWorkspace: {
            id: 'workspace-1',
          },
        },
        get objects() { return this.state.objects; },
        currentZIndex: 5,
      },
      assetResolver: {
        put: jest.fn(),
        resolve: jest.fn(),
      },
      anchorManager: {
        updateAnchorsForObject: jest.fn(),
      },
    } as unknown as jest.Mocked<KritzelCore>;
  };

  beforeEach(() => {
    mockCore = createMockCore();
    imageObject = KritzelImage.create(mockCore);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create an image with default values when no config provided', () => {
      const defaultImage = new KritzelImage();

      expect(defaultImage.__class__).toBe('KritzelImage');
      expect(defaultImage.src).toBe('');
      expect(defaultImage.x).toBe(0);
      expect(defaultImage.y).toBe(0);
      expect(defaultImage.translateX).toBe(0);
      expect(defaultImage.translateY).toBe(0);
      expect(defaultImage.scale).toBe(1);
      expect(defaultImage.maxWidth).toBe(300);
      expect(defaultImage.maxHeight).toBe(300);
      expect(defaultImage.maxCompressionSize).toBe(1200);
    });

    it('should create an image with provided config values', () => {
      const customImage = new KritzelImage({
        src: 'data:image/png;base64,test',
        x: 10,
        y: 20,
        translateX: 30,
        translateY: 40,
        scale: 2,
      });

      expect(customImage.src).toBe('data:image/png;base64,test');
      expect(customImage.x).toBe(10);
      expect(customImage.y).toBe(20);
      expect(customImage.translateX).toBe(30);
      expect(customImage.translateY).toBe(40);
      expect(customImage.scale).toBe(2);
    });

    it('should convert constructor rotation from degrees to radians', () => {
      const customImage = new KritzelImage({
        rotation: -90,
      });

      expect(customImage.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it('should generate a unique id on instantiation', () => {
      const img1 = new KritzelImage();
      const img2 = new KritzelImage();
      expect(img1.id).toBeDefined();
      expect(img2.id).toBeDefined();
      expect(img1.id).not.toBe(img2.id);
    });
  });

  describe('static create', () => {
    it('should create an image with core reference', () => {
      const image = KritzelImage.create(mockCore);
      expect(image._core).toBe(mockCore);
    });

    it('should set workspaceId from active workspace', () => {
      const image = KritzelImage.create(mockCore);
      expect(image.workspaceId).toBe('workspace-1');
    });

    it('should generate a unique id', () => {
      const image = KritzelImage.create(mockCore);
      expect(image.id).toBeDefined();
      expect(typeof image.id).toBe('string');
      expect(image.id.length).toBeGreaterThan(0);
    });

    it('should set scale from core store state', () => {
      const image = KritzelImage.create(mockCore);
      expect(image.scale).toBe(1);
    });

    it('should set scale correctly when core has different scale', () => {
      mockCore.store.state.scale = 2;
      const image = KritzelImage.create(mockCore);
      expect(image.scale).toBe(2);
    });

    it('should set zIndex from currentZIndex', () => {
      const image = KritzelImage.create(mockCore);
      expect(image.zIndex).toBe(5);
    });

    it('should initialize position to 0', () => {
      const image = KritzelImage.create(mockCore);
      expect(image.x).toBe(0);
      expect(image.y).toBe(0);
      expect(image.translateX).toBe(0);
      expect(image.translateY).toBe(0);
    });

    it('should create multiple unique images', () => {
      const img1 = KritzelImage.create(mockCore);
      const img2 = KritzelImage.create(mockCore);
      expect(img1.id).not.toBe(img2.id);
    });

    it('should convert create rotation from degrees to radians', () => {
      const image = KritzelImage.create(mockCore, { rotation: -90 });

      expect(image.rotation).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      imageObject.width = 100;
      imageObject.height = 100;
    });

    it('should resize proportionally based on height', () => {
      imageObject.resize(10, 20, 200, 200);

      expect(imageObject.width).toBe(200);
      expect(imageObject.height).toBe(200);
      expect(imageObject.translateX).toBe(10);
      expect(imageObject.translateY).toBe(20);
    });

    it('should scale down proportionally', () => {
      imageObject.resize(0, 0, 50, 50);

      expect(imageObject.width).toBe(50);
      expect(imageObject.height).toBe(50);
    });

    it('should maintain aspect ratio when scaling', () => {
      imageObject.width = 200;
      imageObject.height = 100;

      imageObject.resize(0, 0, 100, 50);

      expect(imageObject.width).toBe(100);
      expect(imageObject.height).toBe(50);
    });

    it('should not resize when width is less than or equal to 1', () => {
      const originalWidth = imageObject.width;
      const originalHeight = imageObject.height;

      imageObject.resize(10, 20, 1, 50);

      expect(imageObject.width).toBe(originalWidth);
      expect(imageObject.height).toBe(originalHeight);
    });

    it('should not resize when height is less than or equal to 1', () => {
      const originalWidth = imageObject.width;
      const originalHeight = imageObject.height;

      imageObject.resize(10, 20, 50, 1);

      expect(imageObject.width).toBe(originalWidth);
      expect(imageObject.height).toBe(originalHeight);
    });

    it('should not resize when both dimensions are less than or equal to 1', () => {
      const originalWidth = imageObject.width;
      const originalHeight = imageObject.height;

      imageObject.resize(10, 20, 0, 0);

      expect(imageObject.width).toBe(originalWidth);
      expect(imageObject.height).toBe(originalHeight);
    });

    it('should call objects.update after resize', () => {
      imageObject.resize(10, 20, 200, 200);

      expect(mockObjectsUpdate).toHaveBeenCalledWith(imageObject);
    });

    it('should not call objects.update when dimensions are invalid', () => {
      imageObject.resize(10, 20, 0, 0);

      expect(mockObjectsUpdate).not.toHaveBeenCalled();
    });

    it('should update translateX and translateY', () => {
      imageObject.resize(50, 100, 150, 150);

      expect(imageObject.translateX).toBe(50);
      expect(imageObject.translateY).toBe(100);
    });
  });

  describe('calculateScaledDimensions', () => {
    beforeEach(() => {
      // Tests in this block assert behavior of the scale-down branch,
      // which only triggers when image dimensions exceed the configured
      // max. Pin the maxes to 300 so the existing fixtures remain
      // representative of the scale-down logic.
      imageObject.maxWidth = 300;
      imageObject.maxHeight = 300;
    });

    it('should return original dimensions when within max limits', () => {
      const mockImg = { width: 200, height: 200 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      expect(result.scaledWidth).toBe(200);
      expect(result.scaledHeight).toBe(200);
    });

    it('should scale down when width exceeds maxWidth', () => {
      const mockImg = { width: 600, height: 200 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      expect(result.scaledWidth).toBe(300);
      expect(result.scaledHeight).toBe(100);
    });

    it('should scale down when height exceeds maxHeight', () => {
      const mockImg = { width: 200, height: 600 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      expect(result.scaledWidth).toBe(100);
      expect(result.scaledHeight).toBe(300);
    });

    it('should scale down using smallest ratio when both dimensions exceed limits', () => {
      const mockImg = { width: 600, height: 900 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      // Height ratio is smaller (300/900 = 0.333) vs width ratio (300/600 = 0.5)
      expect(result.scaledWidth).toBe(200);
      expect(result.scaledHeight).toBe(300);
    });

    it('should maintain aspect ratio when scaling', () => {
      const mockImg = { width: 800, height: 400 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      const originalRatio = 800 / 400;
      const scaledRatio = result.scaledWidth / result.scaledHeight;

      expect(scaledRatio).toBeCloseTo(originalRatio);
    });

    it('should respect custom maxWidth and maxHeight', () => {
      imageObject.maxWidth = 100;
      imageObject.maxHeight = 100;

      const mockImg = { width: 400, height: 200 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      expect(result.scaledWidth).toBeLessThanOrEqual(100);
      expect(result.scaledHeight).toBeLessThanOrEqual(100);
    });

    it('should handle square images', () => {
      const mockImg = { width: 600, height: 600 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      expect(result.scaledWidth).toBe(300);
      expect(result.scaledHeight).toBe(300);
    });

    it('should handle very small images without scaling', () => {
      const mockImg = { width: 50, height: 50 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      expect(result.scaledWidth).toBe(50);
      expect(result.scaledHeight).toBe(50);
    });

    it('should handle images at exact max dimensions', () => {
      const mockImg = { width: 300, height: 300 } as HTMLImageElement;

      const result = imageObject.calculateScaledDimensions(mockImg);

      expect(result.scaledWidth).toBe(300);
      expect(result.scaledHeight).toBe(300);
    });
  });

  describe('prepareForInsert', () => {
    it('should upload URL source through asset resolver and seed render fields', async () => {
      const sourceUrl = 'http://localhost:4200/assets/floorplan.png';
      const blob = new Blob(['image-bytes'], { type: 'image/png' });

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => blob,
      } as Response);

      jest.spyOn(imageObject as any, 'measureImageBlob').mockResolvedValue({
        naturalWidth: 400,
        naturalHeight: 200,
      });

      (mockCore.assetResolver.put as jest.Mock).mockResolvedValue({
        id: 'asset-1',
        mimeType: 'image/png',
      });
      (mockCore.assetResolver.resolve as jest.Mock).mockResolvedValue('blob:asset-1');

      imageObject.maxWidth = 100;
      imageObject.maxHeight = 100;
      imageObject.src = sourceUrl;

      await imageObject.prepareForInsert();

      expect(globalThis.fetch).toHaveBeenCalledWith(sourceUrl);
      expect(mockCore.assetResolver.put).toHaveBeenCalledWith(blob, {
        mimeType: 'image/png',
        kind: 'image',
        width: 400,
        height: 200,
      });
      expect(imageObject.assetId).toBe('asset-1');
      expect(imageObject.mimeType).toBe('image/png');
      expect(imageObject.width).toBe(100);
      expect(imageObject.height).toBe(50);
      expect(imageObject.resolvedSrc).toBe('blob:asset-1');
      expect(imageObject.loadState).toBe('ready');
      expect(imageObject.src).toBe('');
    });

    it('should preserve explicit width and height when already provided', async () => {
      const sourceUrl = 'http://localhost:4200/assets/custom-size.png';
      const blob = new Blob(['image-bytes'], { type: 'image/png' });

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => blob,
      } as Response);

      jest.spyOn(imageObject as any, 'measureImageBlob').mockResolvedValue({
        naturalWidth: 1000,
        naturalHeight: 500,
      });

      (mockCore.assetResolver.put as jest.Mock).mockResolvedValue({
        id: 'asset-2',
        mimeType: 'image/png',
      });
      (mockCore.assetResolver.resolve as jest.Mock).mockResolvedValue('blob:asset-2');

      imageObject.src = sourceUrl;
      imageObject.width = 240;
      imageObject.height = 180;

      await imageObject.prepareForInsert();

      expect(imageObject.width).toBe(240);
      expect(imageObject.height).toBe(180);
    });

    it('should no-op when image already has an assetId', async () => {
      imageObject.assetId = 'existing-asset';
      imageObject.src = 'http://localhost:4200/assets/floorplan.png';

      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      await imageObject.prepareForInsert();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(mockCore.assetResolver.put).not.toHaveBeenCalled();
    });
  });

  describe('inheritance from KritzelBaseObject', () => {
    it('should inherit default property values from KritzelBaseObject', () => {
      const image = new KritzelImage();
      expect(image.opacity).toBe(1);
      expect(image.padding).toBe(0);
      expect(image.rotation).toBe(0);
      expect(image.isVisible).toBe(true);
      expect(image.isSelected).toBe(false);
      expect(image.isHovered).toBe(false);
      expect(image.isMounted).toBe(false);
      expect(image.markedForRemoval).toBe(false);
    });

    it('should have totalWidth getter that includes padding', () => {
      imageObject.width = 100;
      imageObject.padding = 10;
      expect(imageObject.totalWidth).toBe(120);
    });

    it('should have totalHeight getter that includes padding', () => {
      imageObject.height = 50;
      imageObject.padding = 5;
      expect(imageObject.totalHeight).toBe(60);
    });

    it('should be able to mount an element', () => {
      const mockElement = document.createElement('img') as HTMLImageElement;
      imageObject.mount(mockElement);
      expect(imageObject.isMounted).toBe(true);
      expect(imageObject.elementRef).toBe(mockElement);
    });

    it('should calculate boundingBox correctly', () => {
      imageObject.translateX = 10;
      imageObject.translateY = 20;
      imageObject.width = 100;
      imageObject.height = 50;
      imageObject.scale = 1;
      imageObject.padding = 0;

      const boundingBox = imageObject.boundingBox;
      expect(boundingBox.x).toBe(10);
      expect(boundingBox.y).toBe(20);
      expect(boundingBox.width).toBe(100);
      expect(boundingBox.height).toBe(50);
    });

    it('should calculate centerX correctly', () => {
      imageObject.translateX = 10;
      imageObject.width = 100;
      imageObject.scale = 1;
      imageObject.padding = 0;

      expect(imageObject.centerX).toBe(60);
    });

    it('should calculate centerY correctly', () => {
      imageObject.translateY = 20;
      imageObject.height = 50;
      imageObject.scale = 1;
      imageObject.padding = 0;

      expect(imageObject.centerY).toBe(45);
    });
  });
});
