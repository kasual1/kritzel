import { UpdrawSvgExportHelper, SvgExportOptions } from './svg-export.helper';
import { UpdrawPath } from '../classes/objects/path.class';
import { UpdrawLine } from '../classes/objects/line.class';
import { UpdrawShape } from '../classes/objects/shape.class';
import { UpdrawText } from '../classes/objects/text.class';
import { UpdrawImage } from '../classes/objects/image.class';
import { UpdrawGroup } from '../classes/objects/group.class';
import { UpdrawDynamicObject } from '../classes/objects/dynamic-object.class';
import { ShapeType } from '../enums/shape-type.enum';

// Mock ProseMirror modules for UpdrawText
jest.mock('prosemirror-state', () => ({
  EditorState: {
    create: jest.fn(() => ({
      doc: {
        content: { size: 10 },
        textContent: 'test content',
        toJSON: jest.fn(() => ({ type: 'doc', content: [] })),
      },
      tr: {
        replaceWith: jest.fn().mockReturnThis(),
        setSelection: jest.fn().mockReturnThis(),
        setMeta: jest.fn().mockReturnThis(),
        getMeta: jest.fn(() => false),
        docChanged: false,
      },
      schema: {
        nodeFromJSON: jest.fn(() => ({ content: {} })),
      },
      apply: jest.fn(function () {
        return this;
      }),
    })),
  },
  TextSelection: {
    create: jest.fn(() => ({})),
  },
}));

jest.mock('prosemirror-view', () => ({
  EditorView: jest.fn().mockImplementation((_element, _options) => {
    const mockDom = document.createElement('div');
    mockDom.classList.add('ProseMirror');
    return {
      dom: mockDom,
      state: {
        doc: {
          content: { size: 10 },
          textContent: 'test content',
          toJSON: jest.fn(() => ({ type: 'doc', content: [] })),
        },
        tr: {
          replaceWith: jest.fn().mockReturnThis(),
          setSelection: jest.fn().mockReturnThis(),
          setMeta: jest.fn().mockReturnThis(),
          getMeta: jest.fn(() => false),
        },
        schema: {
          nodeFromJSON: jest.fn(() => ({ content: {} })),
        },
        apply: jest.fn(function () {
          return this;
        }),
      },
      updateState: jest.fn(),
      dispatch: jest.fn(),
      focus: jest.fn(),
      setProps: jest.fn(),
      posAtCoords: jest.fn(() => ({ pos: 5 })),
      destroy: jest.fn(),
    };
  }),
}));

jest.mock('prosemirror-model', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    node: jest.fn(() => ({})),
    spec: { nodes: {}, marks: {} },
  })),
}));

jest.mock('prosemirror-schema-basic', () => ({
  schema: { spec: { nodes: {}, marks: {} } },
}));

jest.mock('prosemirror-schema-list', () => ({
  addListNodes: jest.fn(() => ({})),
}));

jest.mock('prosemirror-keymap', () => ({
  keymap: jest.fn(() => ({})),
}));

jest.mock('prosemirror-commands', () => ({
  baseKeymap: {},
}));

jest.mock('../classes/managers/theme.manager', () => ({
  UpdrawThemeManager: {
    getStoredTheme: jest.fn().mockReturnValue('light'),
  },
}));

describe('UpdrawSvgExportHelper', () => {
  describe('calculateCombinedBounds', () => {
    it('should return null for empty array', () => {
      const result = UpdrawSvgExportHelper.calculateCombinedBounds([]);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = UpdrawSvgExportHelper.calculateCombinedBounds(undefined as any);
      expect(result).toBeNull();
    });

    it('should calculate bounds for a single object', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 50,
        translateY: 50,
        scale: 1,
      });
      path.width = 100;
      path.height = 100;

      const result = UpdrawSvgExportHelper.calculateCombinedBounds([path]);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(46);
      expect(result!.y).toBe(46);
      expect(result!.width).toBeGreaterThan(0);
      expect(result!.height).toBeGreaterThan(0);
    });

    it('should calculate union bounds for multiple objects', () => {
      const path1 = new UpdrawPath({
        points: [[0, 0], [50, 50]],
        translateX: 0,
        translateY: 0,
        scale: 1,
      });
      path1.width = 50;
      path1.height = 50;

      const path2 = new UpdrawPath({
        points: [[0, 0], [50, 50]],
        translateX: 100,
        translateY: 100,
        scale: 1,
      });
      path2.width = 50;
      path2.height = 50;

      const result = UpdrawSvgExportHelper.calculateCombinedBounds([path1, path2]);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(-4);
      expect(result!.y).toBe(-4);
      expect(result!.width).toBe(150);
      expect(result!.height).toBe(150);
    });
  });

  describe('generateSvg', () => {
    it('should return empty string for empty array', () => {
      const result = UpdrawSvgExportHelper.generateSvg([]);
      expect(result).toBe('');
    });

    it('should generate valid SVG with XML declaration by default', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        fill: { light: '#ff0000', dark: '#00ff00' },
      });
      path.width = 100;
      path.height = 100;
      path.d = 'M 0 0 L 100 100';

      const result = UpdrawSvgExportHelper.generateSvg([path]);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result).toContain('viewBox=');
      expect(result).toContain('</svg>');
    });

    it('should omit XML declaration when option is false', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
      });
      path.width = 100;
      path.height = 100;
      path.d = 'M 0 0 L 100 100';

      const options: SvgExportOptions = { includeXmlDeclaration: false };
      const result = UpdrawSvgExportHelper.generateSvg([path], options);

      expect(result).not.toContain('<?xml');
      expect(result).toContain('<svg xmlns');
    });

    it('should add padding to viewBox', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
      });
      path.width = 100;
      path.height = 100;
      path.d = 'M 0 0 L 100 100';

      const options: SvgExportOptions = { padding: 10 };
      const result = UpdrawSvgExportHelper.generateSvg([path], options);

      // ViewBox should include negative offset for padding
      expect(result).toContain('viewBox="-14 -14');
    });
  });

  describe('objectToSvgElement', () => {
    describe('UpdrawPath', () => {
      it('should convert path to SVG element', () => {
        const path = new UpdrawPath({
          points: [[0, 0], [100, 100]],
          translateX: 10,
          translateY: 20,
          scale: 1,
          fill: { light: '#ff0000', dark: '#00ff00' },
        });
        path.width = 100;
        path.height = 100;
        path.d = 'M 0 0 L 100 100';

        const result = UpdrawSvgExportHelper.objectToSvgElement(path, 'light');

        expect(result).toContain('<g transform="translate(6, 16)"');
        expect(result).toContain('<path d="M 0 0 L 100 100"');
        expect(result).toContain('fill="#ff0000"');
      });

      it('should include opacity when not 1', () => {
        const path = new UpdrawPath({
          points: [[0, 0], [100, 100]],
          translateX: 0,
          translateY: 0,
          scale: 1,
        });
        path.width = 100;
        path.height = 100;
        path.d = 'M 0 0 L 100 100';
        path.opacity = 0.5;

        const result = UpdrawSvgExportHelper.objectToSvgElement(path, 'light');

        expect(result).toContain('opacity="0.5"');
      });
    });

    describe('UpdrawLine', () => {
      it('should convert line to SVG element', () => {
        const line = new UpdrawLine({
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
          translateX: 0,
          translateY: 0,
          scale: 1,
          strokeWidth: 2,
          stroke: { light: '#000000', dark: '#ffffff' },
        });

        const result = UpdrawSvgExportHelper.objectToSvgElement(line, 'light');

        expect(result).toContain('<path d=');
        expect(result).toContain('stroke="#000000"');
        expect(result).toContain('stroke-width="2"');
      });

      it('should include arrow markers when arrows are enabled', () => {
        const line = new UpdrawLine({
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 100,
          translateX: 0,
          translateY: 0,
          scale: 1,
          strokeWidth: 2,
          stroke: { light: '#000000', dark: '#ffffff' },
          arrows: {
            start: { enabled: true, style: 'triangle' },
            end: { enabled: true, style: 'triangle' },
          },
        });

        const result = UpdrawSvgExportHelper.generateSvg([line], { includeXmlDeclaration: false });

        expect(result).toContain('<defs>');
        expect(result).toContain('<marker');
        expect(result).toContain('marker-start=');
        expect(result).toContain('marker-end=');
      });
    });

    describe('UpdrawShape', () => {
      it('should convert rectangle shape to SVG element', () => {
        const shape = new UpdrawShape({
          x: 0,
          y: 0,
          translateX: 10,
          translateY: 20,
          width: 100,
          height: 50,
          shapeType: ShapeType.Rectangle,
          fillColor: { light: '#0000ff', dark: '#ff00ff' },
          strokeColor: { light: '#000000', dark: '#ffffff' },
          strokeWidth: 2,
          scale: 1,
        });

        const result = UpdrawSvgExportHelper.objectToSvgElement(shape, 'light');

        expect(result).toContain('<g transform="translate(10, 20)"');
        expect(result).toContain('fill="#0000ff"');
        expect(result).toContain('stroke="#000000"');
        expect(result).toContain('stroke-width="2"');
      });

      it('should convert ellipse shape to SVG element', () => {
        const shape = new UpdrawShape({
          x: 0,
          y: 0,
          translateX: 0,
          translateY: 0,
          width: 100,
          height: 50,
          shapeType: ShapeType.Ellipse,
          scale: 1,
        });

        const result = UpdrawSvgExportHelper.objectToSvgElement(shape, 'light');

        expect(result).toContain('<path d=');
        // Ellipse path uses arc commands
        expect(result).toMatch(/A\s+\d/);
      });

      it('should convert triangle shape to SVG element', () => {
        const shape = new UpdrawShape({
          x: 0,
          y: 0,
          translateX: 0,
          translateY: 0,
          width: 100,
          height: 100,
          shapeType: ShapeType.Triangle,
          scale: 1,
        });

        const result = UpdrawSvgExportHelper.objectToSvgElement(shape, 'light');

        expect(result).toContain('<path d=');
        // Triangle has M, L, L, Z
        expect(result).toMatch(/M\s+\d.*L\s+\d.*L\s+\d.*Z/);
      });
    });

    describe('UpdrawText', () => {
      it('should convert text to SVG with foreignObject', () => {
        const text = new UpdrawText({
          text: 'Hello World',
          translateX: 50,
          translateY: 100,
          fontSize: 16,
          fontFamily: 'Arial',
          fontColor: { light: '#333333', dark: '#cccccc' },
        });
        text.width = 100;
        text.height = 24;
        text.scale = 1;
        text.scaleFactor = 1;

        const result = UpdrawSvgExportHelper.objectToSvgElement(text, 'light');

        expect(result).toContain('<g transform="translate(50, 100)"');
        expect(result).toContain('<foreignObject');
        expect(result).toContain('overflow="visible"');
        expect(result).toContain('font-family: Arial');
        // font-size is now in px (pt converted: 16pt * 4/3 / scale=1 ≈ 21.3333px)
        expect(result).toContain('font-size: 21.3333px');
        expect(result).toContain('color: #333333');
        // margin and padding must be zero so browsers don't add default spacing
        expect(result).toContain('margin: 0');
        expect(result).toContain('padding: 0');
        // transform: scale(...) should no longer appear on the inner div
        expect(result).not.toContain('transform: scale(');
        // overflow: hidden must not be present so text is never clipped
        expect(result).not.toContain('overflow: hidden');
      });

      it('should apply scaleFactor to font-size in foreignObject', () => {
        const text = new UpdrawText({
          text: 'Hello',
          translateX: 0,
          translateY: 0,
          fontSize: 8,
          fontFamily: 'Arial',
          fontColor: { light: '#000000', dark: '#ffffff' },
        });
        text.width = 80;
        text.height = 20;
        text.scale = 1;
        text.scaleFactor = 2;

        const result = UpdrawSvgExportHelper.objectToSvgElement(text, 'light');

        // font-size = 8 * 4/3 * scaleFactor(2) / scale(1) = 21.3333px
        expect(result).toContain('font-size: 21.3333px');
        expect(result).not.toContain('transform: scale(');
      });

      it('should scale down font-size when object scale (coreScale) > 1', () => {
        const text = new UpdrawText({
          text: 'Hello',
          translateX: 0,
          translateY: 0,
          fontSize: 8,
          fontFamily: 'Arial',
          fontColor: { light: '#000000', dark: '#ffffff' },
        });
        text.width = 80;
        text.height = 20;
        text.scale = 2;
        text.scaleFactor = 1;

        const result = UpdrawSvgExportHelper.objectToSvgElement(text, 'light');

        // font-size = 8 * 4/3 * scaleFactor(1) / scale(2) = 5.3333px
        expect(result).toContain('font-size: 5.3333px');
      });

      it('should export text without foreignObject in raster-safe mode', () => {
        const text = new UpdrawText({
          text: 'Hello\nWorld',
          translateX: 50,
          translateY: 100,
          fontSize: 16,
          fontFamily: 'Arial',
          fontColor: { light: '#333333', dark: '#cccccc' },
        });
        text.width = 100;
        text.height = 40;
        text.scale = 1;
        text.scaleFactor = 1;

        const result = UpdrawSvgExportHelper.objectToSvgElement(text, 'light', undefined, true);

        expect(result).toContain('<g transform="translate(50, 100)"');
        expect(result).not.toContain('<foreignObject');
        expect(result).toContain('<text ');
        expect(result).toContain('font-family="Arial"');
        expect(result).toContain('fill="#333333"');
        expect(result).toContain('<tspan');
        // font-size in raster-safe mode: 16 * 4/3 * scaleFactor(1) / scale(1) ≈ 21.3333
        expect(result).toContain('font-size="21.3333');
      });

      it('should scale raster-safe font-size down when object scale (coreScale) > 1', () => {
        const text = new UpdrawText({
          text: 'Hello',
          translateX: 0,
          translateY: 0,
          fontSize: 8,
          fontFamily: 'Arial',
          fontColor: { light: '#000000', dark: '#ffffff' },
        });
        text.width = 80;
        text.height = 20;
        text.scale = 2;
        text.scaleFactor = 1;

        const result = UpdrawSvgExportHelper.objectToSvgElement(text, 'light', undefined, true);

        // font-size = 8 * 4/3 * scaleFactor(1) / scale(2) ≈ 5.3333
        expect(result).toContain('font-size="5.3333');
      });
    });

    describe('UpdrawImage', () => {
      it('should convert image to SVG element', () => {
        const image = new UpdrawImage({
          src: 'data:image/png;base64,ABC123',
          translateX: 100,
          translateY: 200,
          width: 150,
          height: 100,
          scale: 1,
        });

        const result = UpdrawSvgExportHelper.objectToSvgElement(image);

        expect(result).toContain('<g transform="translate(100, 200)"');
        expect(result).toContain('<image href="data:image/png;base64,ABC123"');
        expect(result).toContain('width="150"');
        expect(result).toContain('height="100"');
      });

      it('should prefer the inlined data URL from imageDataUrls over resolvedSrc', () => {
        const image = new UpdrawImage({
          translateX: 0,
          translateY: 0,
          width: 100,
          height: 100,
          scale: 1,
        });
        image.id = 'img-1';
        // A blob: URL would render as a broken image once rasterized.
        image.resolvedSrc = 'blob:https://example.com/abc';

        const imageDataUrls = new Map<string, string>([['img-1', 'data:image/png;base64,INLINED']]);

        const result = UpdrawSvgExportHelper.objectToSvgElement(image, undefined, imageDataUrls);

        expect(result).toContain('<image href="data:image/png;base64,INLINED"');
        expect(result).not.toContain('blob:https://example.com/abc');
      });
    });

    describe('resolveImageDataUrls', () => {
      it('returns an empty map when there are no objects', async () => {
        const result = await UpdrawSvgExportHelper.resolveImageDataUrls([]);
        expect(result.size).toBe(0);
      });

      it('uses the legacy inline data URL src without touching the resolver', async () => {
        const image = new UpdrawImage({ src: 'data:image/png;base64,LEGACY', width: 10, height: 10, scale: 1 });
        image.id = 'img-legacy';

        const fetchBlob = jest.fn();
        const result = await UpdrawSvgExportHelper.resolveImageDataUrls([image], { fetchBlob });

        expect(result.get('img-legacy')).toBe('data:image/png;base64,LEGACY');
        expect(fetchBlob).not.toHaveBeenCalled();
      });

      it('fetches asset bytes and inlines them as a data URL', async () => {
        const image = new UpdrawImage({ width: 10, height: 10, scale: 1 });
        image.id = 'img-asset';
        image.assetId = 'asset-123';

        const blob = new Blob(['hello'], { type: 'image/png' });
        const fetchBlob = jest.fn().mockResolvedValue(blob);

        const result = await UpdrawSvgExportHelper.resolveImageDataUrls([image], { fetchBlob });

        expect(fetchBlob).toHaveBeenCalledWith('asset-123');
        expect(result.get('img-asset')).toMatch(/^data:image\/png;base64,/);
      });

      it('omits images whose asset fails to resolve', async () => {
        const image = new UpdrawImage({ width: 10, height: 10, scale: 1 });
        image.id = 'img-missing';
        image.assetId = 'asset-missing';

        const fetchBlob = jest.fn().mockRejectedValue(new Error('not found'));
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

        const result = await UpdrawSvgExportHelper.resolveImageDataUrls([image], { fetchBlob });

        expect(result.has('img-missing')).toBe(false);
        warnSpy.mockRestore();
      });
    });

    describe('UpdrawGroup', () => {
      it('should convert group with children to nested SVG elements', () => {
        // Create a group with mock _core to enable children getter
        const group = new UpdrawGroup();
        group.translateX = 10;
        group.translateY = 20;
        group.opacity = 0.8;

        // Add pending children since _core is not available
        const path = new UpdrawPath({
          points: [[0, 0], [50, 50]],
          translateX: 0,
          translateY: 0,
          scale: 1,
          fill: { light: '#ff0000', dark: '#00ff00' },
        });
        path.width = 50;
        path.height = 50;
        path.d = 'M 0 0 L 50 50';
        group._pendingChildren.push(path);

        const result = UpdrawSvgExportHelper.objectToSvgElement(group, 'light');

        expect(result).toContain('<g opacity="0.8"');
        expect(result).toContain('<path d="M 0 0 L 50 50"');
      });

      it('should return empty string for empty group', () => {
        const group = new UpdrawGroup();

        const result = UpdrawSvgExportHelper.objectToSvgElement(group, 'light');

        expect(result).toBe('');
      });
    });
  });

  describe('rotation handling', () => {
    it('should include rotation transform when object is rotated', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
      });
      path.width = 100;
      path.height = 100;
      path.d = 'M 0 0 L 100 100';
      path.rotation = Math.PI / 4; // 45 degrees

      const result = UpdrawSvgExportHelper.objectToSvgElement(path, 'light');

      expect(result).toContain('rotate(45');
    });

    it('should not include rotation transform when rotation is 0', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
      });
      path.width = 100;
      path.height = 100;
      path.d = 'M 0 0 L 100 100';
      path.rotation = 0;

      const result = UpdrawSvgExportHelper.objectToSvgElement(path, 'light');

      expect(result).not.toContain('rotate(');
    });
  });

  describe('theme color resolution', () => {
    it('should resolve light theme colors', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        fill: { light: '#aabbcc', dark: '#112233' },
      });
      path.width = 100;
      path.height = 100;
      path.d = 'M 0 0 L 100 100';

      const result = UpdrawSvgExportHelper.objectToSvgElement(path, 'light');

      expect(result).toContain('fill="#aabbcc"');
    });

    it('should resolve dark theme colors', () => {
      const path = new UpdrawPath({
        points: [[0, 0], [100, 100]],
        translateX: 0,
        translateY: 0,
        scale: 1,
        fill: { light: '#aabbcc', dark: '#112233' },
      });
      path.width = 100;
      path.height = 100;
      path.d = 'M 0 0 L 100 100';

      const result = UpdrawSvgExportHelper.objectToSvgElement(path, 'dark');

      expect(result).toContain('fill="#112233"');
    });
  });

  describe('HTML escaping', () => {
    it('should escape special characters in text content', () => {
      const text = new UpdrawText({
        translateX: 0,
        translateY: 0,
      });
      text.width = 100;
      text.height = 24;
      text.content = {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: '<script>alert("xss")</script>',
          }],
        }],
      };

      const result = UpdrawSvgExportHelper.objectToSvgElement(text, 'light');

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('UpdrawDynamicObject SVG export', () => {
    it('should export dynamic object as foreignObject in SVG mode', () => {
      const el = document.createElement('div');
      el.textContent = 'Custom Content';
      const obj = new UpdrawDynamicObject({
        element: el,
        translateX: 0,
        translateY: 0,
      });
      obj.width = 200;
      obj.height = 100;

      const svg = UpdrawSvgExportHelper.objectToSvgElement(obj, 'light', undefined, false);

      expect(svg).toContain('foreignObject');
      expect(svg).toContain('Custom Content');
      expect(svg).toContain('width=\"200\"');
      expect(svg).toContain('height=\"100\"');
    });

    it('should export dynamic object as placeholder rect in raster-safe mode', () => {
      const el = document.createElement('div');
      el.textContent = 'Custom';
      const obj = new UpdrawDynamicObject({
        element: el,
        translateX: 0,
        translateY: 0,
      });
      obj.width = 150;
      obj.height = 80;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const svg = UpdrawSvgExportHelper.objectToSvgElement(obj, 'light', undefined, true);

      expect(svg).toContain('<rect');
      expect(svg).toContain('[Dynamic Object]');
      expect(svg).not.toContain('foreignObject');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dynamic objects do not serialize well'));

      consoleSpy.mockRestore();
    });

    it('should handle empty dynamic object', () => {
      const obj = new UpdrawDynamicObject({
        element: document.createElement('div'),
        translateX: 0,
        translateY: 0,
      });
      obj.width = 100;
      obj.height = 100;

      const svg = UpdrawSvgExportHelper.objectToSvgElement(obj, 'light', undefined, false);

      expect(svg).toContain('foreignObject');
    });

    it('should apply opacity to dynamic object SVG', () => {
      const el = document.createElement('div');
      el.textContent = 'Transparent';
      const obj = new UpdrawDynamicObject({
        element: el,
        translateX: 0,
        translateY: 0,
      });
      obj.width = 100;
      obj.height = 100;
      obj.opacity = 0.5;

      const svg = UpdrawSvgExportHelper.objectToSvgElement(obj, 'light', undefined, false);

      expect(svg).toContain('opacity=\"0.5\"');
    });
  });
});
