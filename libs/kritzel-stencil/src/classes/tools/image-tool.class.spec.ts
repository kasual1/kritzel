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

    (KritzelImage.fromBlob as jest.Mock).mockResolvedValue(mockImage);

    mockCore = {
      store: {
        isDisabled: false,
        currentZIndex: 5,
        setState: jest.fn(),
      },
      addObject: jest.fn(),
      selectObjects: jest.fn(),
      engine: {
        emitObjectsChange: jest.fn(),
        emitObjectsAdded: jest.fn(),
        emitObjectsRemoved: jest.fn(),
        emitObjectsUpdated: jest.fn(),
      },
      toolRegistry: { getTool: jest.fn().mockReturnValue(mockSelectionTool) },
    } as unknown as jest.Mocked<KritzelCore>;

    tool = new KritzelImageTool(mockCore);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
  // fromBlob integration contract
  // ============================================

  describe('fromBlob integration contract', () => {
    let handleFileSelect: (event: Event) => void;

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];
    });

    it('should pass compressed files to KritzelImage.fromBlob with core', async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/png' });
      mockImageCompression.mockResolvedValue(compressedFile);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      handleFileSelect(event);
      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(KritzelImage.fromBlob).toHaveBeenCalledWith(mockCore, compressedFile);
    });

    it('should pass GIF files to KritzelImage.fromBlob without compression', async () => {
      const gifFile = new File(['gif-data'], 'animated.gif', { type: 'image/gif' });
      const event = { target: { files: [gifFile] } } as unknown as Event;

      handleFileSelect(event);
      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(mockImageCompression).not.toHaveBeenCalled();
      expect(KritzelImage.fromBlob).toHaveBeenCalledWith(mockCore, gifFile);
    });

    it('should preserve GIF files identified by extension when the MIME type is empty', async () => {
      const gifFile = new File(['gif-data'], 'animated.GIF');
      const event = { target: { files: [gifFile] } } as unknown as Event;

      handleFileSelect(event);
      await new Promise(process.nextTick);
      await new Promise(process.nextTick);

      expect(mockImageCompression).not.toHaveBeenCalled();
      expect(KritzelImage.fromBlob).toHaveBeenCalledWith(mockCore, gifFile);
    });
  });

  // ============================================
  // addImageToStore
  // ============================================

  describe('addImageToStore', () => {
    let handleFileSelect: (event: Event) => void;

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];

    });

    const triggerFullImageFlow = async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/png' });
      mockImageCompression.mockResolvedValue(compressedFile);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      handleFileSelect(event);
      await new Promise(process.nextTick);
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
    let createdImages: any[];

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];

      createdImages = [];
      (KritzelImage.fromBlob as jest.Mock).mockImplementation(() => {
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
        return Promise.resolve(img);
      });
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

      handleFileSelect(event);

      await flushAsync();
      await flushAsync();
    };

    it('should create one KritzelImage per selected file', async () => {
      await triggerMultiFileFlow(3);

      expect(KritzelImage.fromBlob).toHaveBeenCalledTimes(3);
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
