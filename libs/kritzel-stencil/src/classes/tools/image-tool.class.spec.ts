import { KritzelImageTool } from './image-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelImage } from '../objects/image.class';

jest.mock('../core/core.class');
jest.mock('../objects/image.class');

const mockImageCompression = jest.fn();
jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: (...args: any[]) => mockImageCompression(...args),
}));

describe('KritzelImageTool', () => {
  let tool: KritzelImageTool;
  let mockCore: any;
  let mockFileInput: any;
  let mockSelectionTool: any;
  let mockImage: any;
  let originalFileReader: typeof FileReader;
  let originalImage: typeof Image;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFileInput = {
      type: '',
      accept: '',
      style: { display: '' },
      click: jest.fn(),
      addEventListener: jest.fn(),
      value: '',
    };

    jest.spyOn(document, 'createElement').mockReturnValue(mockFileInput as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(jest.fn());

    mockSelectionTool = { name: 'selection' };

    mockImage = {
      id: 'img-1',
      src: '',
      width: 0,
      height: 0,
      zIndex: 0,
      translateX: 0,
      translateY: 0,
      calculateScaledDimensions: jest.fn().mockReturnValue({ scaledWidth: 200, scaledHeight: 150 }),
      centerInViewport: jest.fn(),
      updatePosition: jest.fn(),
    };

    (KritzelImage.create as jest.Mock).mockReturnValue(mockImage);

    mockCore = {
      store: {
        isDisabled: false,
        currentZIndex: 5,
        setState: jest.fn(),
      },
      addObject: jest.fn(),
      selectObjects: jest.fn(),
      assetResolver: {
        put: jest.fn().mockResolvedValue({ id: 'asset-1', mimeType: 'image/png' }),
        resolve: jest.fn().mockResolvedValue('blob:resolved-url'),
      },
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      toolRegistry: { getTool: jest.fn().mockReturnValue(mockSelectionTool) },
    } as unknown as jest.Mocked<KritzelCore>;

    originalFileReader = global.FileReader;
    originalImage = global.Image;

    tool = new KritzelImageTool(mockCore);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.FileReader = originalFileReader;
    global.Image = originalImage;
  });

  // ============================================
  // Constructor & setupFileInput
  // ============================================

  describe('constructor', () => {
    it('should create a file input element', () => {
      expect(document.createElement).toHaveBeenCalledWith('input');
    });

    it('should configure the file input with correct attributes', () => {
      expect(mockFileInput.type).toBe('file');
      expect(mockFileInput.accept).toBe('image/*');
      expect(mockFileInput.multiple).toBe(true);
      expect(mockFileInput.style.display).toBe('none');
    });

    it('should register change and cancel event listeners', () => {
      expect(mockFileInput.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockFileInput.addEventListener).toHaveBeenCalledWith('cancel', expect.any(Function));
    });

    it('should append the file input to document body', () => {
      expect(document.body.appendChild).toHaveBeenCalledWith(mockFileInput);
    });

    it('should set fileInput property', () => {
      expect(tool.fileInput).toBe(mockFileInput);
    });

    it('should have default maxCompressionSize of 1200', () => {
      expect(tool.maxCompressionSize).toBe(1200);
    });
  });

  // ============================================
  // onActivate / openFilePicker
  // ============================================

  describe('onActivate', () => {
    it('should click the file input to open file picker', () => {
      tool.onActivate();

      expect(mockFileInput.click).toHaveBeenCalled();
    });

    it('should not click the file input when store is disabled', () => {
      mockCore.store.isDisabled = true;

      tool.onActivate();

      expect(mockFileInput.click).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handleFileSelect
  // ============================================

  describe('handleFileSelect', () => {
    let handleFileSelect: (event: Event) => void;

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];
    });

    it('should compress the selected file with maxCompressionSize', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      mockImageCompression.mockResolvedValue(new File([], 'compressed.jpg'));
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      handleFileSelect(event);

      expect(mockImageCompression).toHaveBeenCalledWith(mockFile, {
        maxWidthOrHeight: 1200,
      });
    });

    it('should use custom maxCompressionSize when changed', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      mockImageCompression.mockResolvedValue(new File([], 'compressed.jpg'));
      tool.maxCompressionSize = 500;
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      handleFileSelect(event);

      expect(mockImageCompression).toHaveBeenCalledWith(mockFile, {
        maxWidthOrHeight: 500,
      });
    });

    it('should call handleCancel when no files are selected', () => {
      const event = { target: { files: null } } as unknown as Event;

      handleFileSelect(event);

      expect(mockImageCompression).not.toHaveBeenCalled();
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });

    it('should call handleCancel when files array is empty', () => {
      const event = { target: { files: [] } } as unknown as Event;

      handleFileSelect(event);

      expect(mockImageCompression).not.toHaveBeenCalled();
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });

    it('should reset file input value after selection', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      mockImageCompression.mockResolvedValue(new File([], 'compressed.jpg'));
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile], value: 'C:\\test.png' } } as unknown as Event;

      handleFileSelect(event);

      expect((event.target as HTMLInputElement).value).toBe('');
    });

    it('should call handleCancel on compression error', async () => {
      const error = new Error('Compression failed');
      mockImageCompression.mockRejectedValue(error);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      handleFileSelect(event);

      await new Promise(process.nextTick);

      expect(consoleSpy).toHaveBeenCalledWith('Error during image compression or processing:', error);
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);

      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // uploadAndPlace (integration)
  // ============================================

  describe('upload and placement', () => {
    let handleFileSelect: (event: Event) => void;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];

      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn(() => 'blob:temp-url') as any;
      URL.revokeObjectURL = jest.fn() as any;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    const triggerFullImageFlow = async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/png' });
      mockImageCompression.mockResolvedValue(compressedFile);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      let imgOnload: (() => void) | null = null;
      const mockImg: any = {
        src: '',
        naturalWidth: 400,
        naturalHeight: 300,
        set onload(fn: () => void) {
          imgOnload = fn;
        },
        set onerror(_fn: (err: unknown) => void) {
          /* noop */
        },
      };
      global.Image = jest.fn(() => mockImg) as any;

      handleFileSelect(event);

      // Allow imageCompression promise to resolve
      await new Promise(process.nextTick);
      // Trigger the Image onload so measureImage resolves
      imgOnload!();
      // Allow subsequent awaits (measureImage, put, resolve) to flush
      await new Promise(process.nextTick);
      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      return { compressedFile, mockImg };
    };

    it('should create a temporary object URL for the compressed blob', async () => {
      const { compressedFile } = await triggerFullImageFlow();

      expect(URL.createObjectURL).toHaveBeenCalledWith(compressedFile);
    });

    it('should upload the blob through the asset resolver with dimensions', async () => {
      const { compressedFile } = await triggerFullImageFlow();

      expect((mockCore as any).assetResolver.put).toHaveBeenCalledWith(compressedFile, {
        mimeType: 'image/png',
        kind: 'image',
        width: 400,
        height: 300,
      });
    });

    it('should create a KritzelImage with asset metadata and scaled dimensions', async () => {
      await triggerFullImageFlow();

      expect(KritzelImage.create).toHaveBeenCalledWith(mockCore);
      expect(mockImage.assetId).toBe('asset-1');
      expect(mockImage.mimeType).toBe('image/png');
      expect(mockImage.calculateScaledDimensions).toHaveBeenCalledWith({ width: 400, height: 300 });
      expect(mockImage.width).toBe(200);
      expect(mockImage.height).toBe(150);
      expect(mockImage.zIndex).toBe(5);
      expect(mockImage.resolvedSrc).toBe('blob:resolved-url');
      expect(mockImage.loadState).toBe('ready');
      expect(mockImage.centerInViewport).toHaveBeenCalled();
    });

    it('should revoke the temporary object URL', async () => {
      await triggerFullImageFlow();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:temp-url');
    });
  });

  // ============================================
  // addImageToStore
  // ============================================

  describe('addImageToStore', () => {
    let handleFileSelect: (event: Event) => void;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];

      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn(() => 'blob:temp-url') as any;
      URL.revokeObjectURL = jest.fn() as any;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    const triggerFullImageFlow = async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/png' });
      mockImageCompression.mockResolvedValue(compressedFile);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      let imgOnload: (() => void) | null = null;
      const mockImg: any = {
        src: '',
        naturalWidth: 200,
        naturalHeight: 150,
        set onload(fn: () => void) {
          imgOnload = fn;
        },
        set onerror(_fn: (err: unknown) => void) {
          /* noop */
        },
      };
      global.Image = jest.fn(() => mockImg) as any;

      handleFileSelect(event);
      await new Promise(process.nextTick);
      imgOnload!();
      await new Promise(process.nextTick);
      await new Promise(process.nextTick);
      await new Promise(process.nextTick);
    };

    it('should add the image to core', async () => {
      await triggerFullImageFlow();

      expect(mockCore.addObject).toHaveBeenCalledWith(mockImage);
    });

    it('should switch active tool to selection', async () => {
      await triggerFullImageFlow();

      expect(mockCore.toolRegistry.getTool).toHaveBeenCalledWith('selection');
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });

    it('should select the newly created image', async () => {
      await triggerFullImageFlow();

      expect(mockCore.selectObjects).toHaveBeenCalledWith([mockImage]);
    });

    it('should emit objects change', async () => {
      await triggerFullImageFlow();

      expect(mockCore.engine.emitObjectsChange).toHaveBeenCalled();
    });
  });

  // ============================================
  // handleCancel
  // ============================================

  describe('handleCancel', () => {
    it('should switch active tool to selection on cancel', () => {
      const cancelCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'cancel',
      );
      const handleCancel = cancelCall[1];

      handleCancel();

      expect(mockCore.toolRegistry.getTool).toHaveBeenCalledWith('selection');
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });
  });

  // ============================================
  // Multi-file selection
  // ============================================

  describe('multi-file selection', () => {
    let handleFileSelect: (event: Event) => void;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;
    let createdImages: any[];

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];

      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn(() => 'blob:temp-url') as any;
      URL.revokeObjectURL = jest.fn() as any;

      createdImages = [];
      (KritzelImage.create as jest.Mock).mockImplementation(() => {
        const img: any = {
          id: `img-${createdImages.length + 1}`,
          src: '',
          width: 0,
          height: 0,
          zIndex: 0,
          translateX: 0,
          translateY: 0,
          calculateScaledDimensions: jest.fn().mockReturnValue({ scaledWidth: 200, scaledHeight: 150 }),
          centerInViewport: jest.fn(),
          updatePosition: jest.fn(),
        };
        createdImages.push(img);
        return img;
      });
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    const flushAsync = async () => {
      for (let i = 0; i < 8; i++) {
        await new Promise(process.nextTick);
      }
    };

    const triggerMultiFileFlow = async (fileCount: number) => {
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/png' });
      mockImageCompression.mockResolvedValue(compressedFile);

      const files = Array.from({ length: fileCount }, (_, i) =>
        new File(['image-data'], `test-${i}.png`, { type: 'image/png' }),
      );
      const event = { target: { files } } as unknown as Event;

      const onloadCallbacks: Array<() => void> = [];
      global.Image = jest.fn(() => {
        const mockImg: any = {
          src: '',
          naturalWidth: 400,
          naturalHeight: 300,
          set onload(fn: () => void) {
            onloadCallbacks.push(fn);
          },
          set onerror(_fn: (err: unknown) => void) {
            /* noop */
          },
        };
        return mockImg;
      }) as any;

      handleFileSelect(event);

      // Allow compression promises to resolve so measureImage's Image is created
      await flushAsync();
      onloadCallbacks.forEach(cb => cb());
      await flushAsync();
    };

    it('should create one KritzelImage per selected file', async () => {
      await triggerMultiFileFlow(3);

      expect(KritzelImage.create).toHaveBeenCalledTimes(3);
      expect(mockCore.addObject).toHaveBeenCalledTimes(3);
    });

    it('should emit a single batch emitObjectsAdded with all images', async () => {
      await triggerMultiFileFlow(3);

      expect(mockCore.engine.emitObjectsAdded).toHaveBeenCalledTimes(1);
      expect(mockCore.engine.emitObjectsAdded).toHaveBeenCalledWith(createdImages);
    });

    it('should switch to selection tool exactly once', async () => {
      await triggerMultiFileFlow(3);

      const toolSwitchCalls = (mockCore.store.setState as jest.Mock).mock.calls.filter(
        call => call[0] === 'activeTool',
      );
      expect(toolSwitchCalls).toHaveLength(1);
      expect(toolSwitchCalls[0][1]).toBe(mockSelectionTool);
    });

    it('should select all created images together', async () => {
      await triggerMultiFileFlow(3);

      expect(mockCore.selectObjects).toHaveBeenCalledWith(createdImages);
    });

    it('should assign incrementing z-indexes based on currentZIndex', async () => {
      await triggerMultiFileFlow(3);

      expect(createdImages[0].zIndex).toBe(5);
      expect(createdImages[1].zIndex).toBe(6);
      expect(createdImages[2].zIndex).toBe(7);
    });

    it('should center the first image and offset subsequent ones diagonally', async () => {
      await triggerMultiFileFlow(3);

      expect(createdImages[0].centerInViewport).toHaveBeenCalled();
      expect(createdImages[0].updatePosition).not.toHaveBeenCalled();

      expect(createdImages[1].centerInViewport).toHaveBeenCalled();
      expect(createdImages[1].updatePosition).toHaveBeenCalledWith(20, 20);

      expect(createdImages[2].centerInViewport).toHaveBeenCalled();
      expect(createdImages[2].updatePosition).toHaveBeenCalledWith(40, 40);
    });

    it('should continue with successful images when some compressions fail', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/png' });
      mockImageCompression
        .mockResolvedValueOnce(compressedFile)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(compressedFile);

      const files = [
        new File(['a'], 'a.png', { type: 'image/png' }),
        new File(['b'], 'b.png', { type: 'image/png' }),
        new File(['c'], 'c.png', { type: 'image/png' }),
      ];
      const event = { target: { files } } as unknown as Event;

      const onloadCallbacks: Array<() => void> = [];
      global.Image = jest.fn(() => {
        const mockImg: any = {
          src: '',
          naturalWidth: 400,
          naturalHeight: 300,
          set onload(fn: () => void) {
            onloadCallbacks.push(fn);
          },
          set onerror(_fn: (err: unknown) => void) {
            /* noop */
          },
        };
        return mockImg;
      }) as any;

      handleFileSelect(event);
      for (let i = 0; i < 8; i++) {
        await new Promise(process.nextTick);
      }
      onloadCallbacks.forEach(cb => cb());
      for (let i = 0; i < 8; i++) {
        await new Promise(process.nextTick);
      }

      expect(mockCore.addObject).toHaveBeenCalledTimes(2);
      expect(mockCore.engine.emitObjectsAdded).toHaveBeenCalledTimes(1);
      expect(mockCore.engine.emitObjectsAdded).toHaveBeenCalledWith(createdImages);
    });
  });
});
