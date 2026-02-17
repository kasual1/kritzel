import { KritzelImageTool } from './image-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelToolRegistry } from '../registries/tool.registry';

jest.mock('../core/core.class');
jest.mock('../objects/image.class');
jest.mock('../registries/tool.registry');

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
    (KritzelToolRegistry.getTool as jest.Mock).mockReturnValue(mockSelectionTool);

    mockImage = {
      id: 'img-1',
      src: '',
      width: 0,
      height: 0,
      zIndex: 0,
      calculateScaledDimensions: jest.fn().mockReturnValue({ scaledWidth: 200, scaledHeight: 150 }),
      centerInViewport: jest.fn(),
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
      engine: {
        emitObjectsChange: jest.fn(),
      },
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

    it('should have default maxCompressionSize of 300', () => {
      expect(tool.maxCompressionSize).toBe(300);
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
        maxWidthOrHeight: 300,
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
  // readFile & createKritzelImage (integration)
  // ============================================

  describe('file reading and image creation', () => {
    let handleFileSelect: (event: Event) => void;
    let mockFileReader: any;

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];

      mockFileReader = {
        onload: null as any,
        readAsDataURL: jest.fn(),
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    it('should read the compressed file as DataURL', async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg');
      mockImageCompression.mockResolvedValue(compressedFile);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      handleFileSelect(event);

      await new Promise(process.nextTick);

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(compressedFile);
    });

    it('should create a KritzelImage when file is loaded', async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg');
      mockImageCompression.mockResolvedValue(compressedFile);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      let imgOnload: (() => void) | null = null;
      const mockImg: any = {
        src: '',
        width: 400,
        height: 300,
        set onload(fn: () => void) {
          imgOnload = fn;
        },
      };
      global.Image = jest.fn(() => mockImg) as any;

      handleFileSelect(event);

      await new Promise(process.nextTick);

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: 'data:image/png;base64,abc123' } });
      expect(mockImg.src).toBe('data:image/png;base64,abc123');

      // Simulate Image onload
      imgOnload!();

      expect(KritzelImage.create).toHaveBeenCalledWith(mockCore);
      expect(mockImage.calculateScaledDimensions).toHaveBeenCalledWith(mockImg);
      expect(mockImage.src).toBe('data:image/png;base64,abc123');
      expect(mockImage.width).toBe(200);
      expect(mockImage.height).toBe(150);
      expect(mockImage.zIndex).toBe(5);
      expect(mockImage.centerInViewport).toHaveBeenCalled();
    });
  });

  // ============================================
  // addImageToStore
  // ============================================

  describe('addImageToStore', () => {
    let handleFileSelect: (event: Event) => void;
    let mockFileReader: any;

    beforeEach(() => {
      const changeCall = mockFileInput.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'change',
      );
      handleFileSelect = changeCall[1];

      mockFileReader = {
        onload: null as any,
        readAsDataURL: jest.fn(),
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    const triggerFullImageFlow = async () => {
      const compressedFile = new File(['compressed'], 'compressed.jpg');
      mockImageCompression.mockResolvedValue(compressedFile);
      const mockFile = new File(['image-data'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      let imgOnload: (() => void) | null = null;
      const mockImg: any = {
        src: '',
        width: 200,
        height: 150,
        set onload(fn: () => void) {
          imgOnload = fn;
        },
      };
      global.Image = jest.fn(() => mockImg) as any;

      handleFileSelect(event);
      await new Promise(process.nextTick);

      mockFileReader.onload({ target: { result: 'data:image/png;base64,abc' } });
      imgOnload!();
    };

    it('should add the image to core', async () => {
      await triggerFullImageFlow();

      expect(mockCore.addObject).toHaveBeenCalledWith(mockImage);
    });

    it('should switch active tool to selection', async () => {
      await triggerFullImageFlow();

      expect(KritzelToolRegistry.getTool).toHaveBeenCalledWith('selection');
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

      expect(KritzelToolRegistry.getTool).toHaveBeenCalledWith('selection');
      expect(mockCore.store.setState).toHaveBeenCalledWith('activeTool', mockSelectionTool);
    });
  });
});
