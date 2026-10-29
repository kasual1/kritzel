import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelPath } from '../classes/objects/path.class';
import { KritzelLine } from '../classes/objects/line.class';
import { KritzelShape } from '../classes/objects/shape.class';
import { KritzelText } from '../classes/objects/text.class';
import { KritzelImage } from '../classes/objects/image.class';
import { KritzelGroup } from '../classes/objects/group.class';
import { KritzelDynamicObject } from '../classes/objects/dynamic-object.class';
import { KritzelIframeObject } from '../classes/objects/iframe.class';
import { KritzelColorHelper } from './color.helper';
import { ThemeName } from '../interfaces/theme.interface';
import { KritzelBoundingBox } from '../interfaces/bounding-box.interface';

/**
 * Options for SVG export.
 */
export interface SvgExportOptions {
  /** Theme to use for resolving theme-aware colors. Defaults to current theme. */
  theme?: ThemeName;
  /** Padding around the exported content in world units. Defaults to 0. */
  padding?: number;
  /** Whether to include XML declaration. Defaults to true. */
  includeXmlDeclaration?: boolean;
  /**
   * Enables raster-safe serialization for objects that normally rely on
   * `<foreignObject>` (currently text). Use this when the generated SVG is
   * rendered into an `<img>` and then drawn to a canvas for PNG export.
   */
  rasterSafeForCanvas?: boolean;
  /**
   * Map of image object id -> inlined `data:` URL used to embed image
   * bytes directly into the exported markup. Required for the bytes to
   * survive rasterization (e.g. SVG -> PNG), because browsers refuse to
   * load external/`blob:` resources referenced from an SVG loaded into
   * an `<img>` element. Populate via {@link KritzelSvgExportHelper.resolveImageDataUrls}.
   */
  imageDataUrls?: Map<string, string>;
}

/**
 * Minimal structural contract for the asset resolver dependency used by
 * the export inlining path. Declared structurally to keep this helper
 * decoupled from the concrete resolver implementation.
 */
export interface SvgExportAssetResolver {
  fetchBlob(id: string): Promise<Blob>;
}

/**
 * Helper class for exporting Kritzel objects to SVG format.
 * Generates clean, standards-compliant SVG markup from canvas objects.
 */
export class KritzelSvgExportHelper {
  /**
   * Calculates the combined bounding box that encompasses all objects.
   * Uses rotatedBoundingBox to account for object rotation.
   * @param objects - Array of objects to calculate bounds for
   * @returns Combined bounding box, or null if no objects provided
   */
  static calculateCombinedBounds(objects: KritzelBaseObject[]): KritzelBoundingBox | null {
    if (!objects || objects.length === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const obj of objects) {
      const bbox = obj.rotatedBoundingBox;
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    }

    return {
      x: minX,
      y: minY,
      z: 1,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Generates a complete SVG document string from the given objects.
   * @param objects - Objects to export
   * @param options - Export options
   * @returns SVG document string
   */
  static generateSvg(objects: KritzelBaseObject[], options: SvgExportOptions = {}): string {
    const { theme, padding = 0, includeXmlDeclaration = true, rasterSafeForCanvas = false, imageDataUrls } = options;

    if (!objects || objects.length === 0) {
      return '';
    }

    // Flatten groups to get all objects including nested children
    const allObjects = this.flattenObjects(objects);
    
    const bounds = this.calculateCombinedBounds(allObjects);
    if (!bounds) {
      return '';
    }

    // Add padding to bounds
    const viewBoxX = bounds.x - padding;
    const viewBoxY = bounds.y - padding;
    const viewBoxWidth = bounds.width + padding * 2;
    const viewBoxHeight = bounds.height + padding * 2;

    // Collect all defs (markers, patterns, etc.)
    const defs = this.collectDefs(allObjects, theme);

    // Generate SVG elements for each object
    const elements = objects
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(obj => this.objectToSvgElement(obj, theme, imageDataUrls, rasterSafeForCanvas))
      .filter(Boolean)
      .join('\n  ');

    const xmlDecl = includeXmlDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';
    const defsContent = defs.length > 0 ? `\n  <defs>\n    ${defs.join('\n    ')}\n  </defs>` : '';

    return `${xmlDecl}<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">${defsContent}
  ${elements}
</svg>`;
  }

  /**
   * Flattens a list of objects, expanding groups into their children recursively.
   * @param objects - Objects to flatten
   * @returns Flat array of all objects including group children
   */
  private static flattenObjects(objects: KritzelBaseObject[]): KritzelBaseObject[] {
    const result: KritzelBaseObject[] = [];
    
    for (const obj of objects) {
      if (obj instanceof KritzelGroup) {
        result.push(...this.flattenObjects(obj.children));
      } else {
        result.push(obj);
      }
    }
    
    return result;
  }

  /**
   * Resolves every image referenced by the given objects (including those
   * nested inside groups) to an inlined `data:` URL, keyed by object id.
   *
   * This is required for export flows that rasterize the SVG (e.g. PNG
   * export): an SVG loaded into an `<img>` element will NOT load external
   * or `blob:` resources, so a `<image href="blob:...">` renders as a
   * broken-image placeholder. Embedding the bytes as a base64 `data:` URL
   * makes the image self-contained and survive rasterization.
   *
   * Resolution is best-effort: images that fail to resolve are simply
   * omitted from the map, and the SVG falls back to whatever `href` the
   * synchronous path would have produced.
   * @param objects - Objects to inline images for
   * @param assetResolver - Resolver used to fetch asset bytes; optional
   * @returns Map of image object id -> inlined `data:` URL
   */
  static async resolveImageDataUrls(objects: KritzelBaseObject[], assetResolver?: SvgExportAssetResolver): Promise<Map<string, string>> {
    const dataUrls = new Map<string, string>();

    if (!objects || objects.length === 0) {
      return dataUrls;
    }

    const images = this.flattenObjects(objects).filter((obj): obj is KritzelImage => obj instanceof KritzelImage);

    await Promise.all(
      images.map(async image => {
        // Legacy inline data URL is already embeddable as-is.
        if (image.src?.startsWith('data:')) {
          dataUrls.set(image.id, image.src);
          return;
        }
        // A resolvedSrc that is itself a data URL can be embedded directly.
        if (image.resolvedSrc?.startsWith('data:')) {
          dataUrls.set(image.id, image.resolvedSrc);
          return;
        }
        if (!image.assetId || !assetResolver) {
          return;
        }
        try {
          const blob = await assetResolver.fetchBlob(image.assetId);
          dataUrls.set(image.id, await this.blobToDataUrl(blob));
        } catch (err) {
          console.warn(`[KritzelSvgExportHelper] Failed to inline image asset ${image.assetId} for export:`, err);
        }
      }),
    );

    return dataUrls;
  }

  /**
   * Reads a Blob into a base64 `data:` URL.
   * @param blob - The blob to encode
   * @returns Promise resolving to the data URL string
   */
  private static async blobToDataUrl(blob: Blob): Promise<string> {
    // Prefer FileReader in browser-like runtimes for efficiency.
    const hasFileReader = typeof FileReader !== 'undefined';
    if (hasFileReader) {
      try {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
              return;
            }
            reject(new Error('FileReader result is not a string'));
          };
          reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob as data URL'));
          reader.readAsDataURL(blob);
        });
      } catch {
        // Fall through to the ArrayBuffer-based encoder.
      }
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mimeType = blob.type || 'application/octet-stream';
    return `data:${mimeType};base64,${this.uint8ToBase64(bytes)}`;
  }

  /**
   * Encodes a byte array to base64 across browser and Node-like runtimes.
   */
  private static uint8ToBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }

    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }

    if (typeof btoa === 'function') {
      return btoa(binary);
    }

    throw new Error('No base64 encoder available in this runtime');
  }

  /**
   * Collects SVG defs (markers, patterns, etc.) needed by the objects.
   * @param objects - Objects to collect defs for
   * @param theme - Theme for color resolution
   * @returns Array of def element strings
   */
  private static collectDefs(objects: KritzelBaseObject[], theme?: ThemeName): string[] {
    const defs: string[] = [];

    for (const obj of objects) {
      if (obj instanceof KritzelLine) {
        if (obj.hasStartArrow) {
          defs.push(this.generateArrowMarker(obj, 'start', theme));
        }
        if (obj.hasEndArrow) {
          defs.push(this.generateArrowMarker(obj, 'end', theme));
        }
      }
    }

    return defs;
  }

  /**
   * Generates an SVG marker element for line arrows.
   * @param line - The line object
   * @param end - Which end of the line ('start' or 'end')
   * @param theme - Theme for color resolution
   * @returns SVG marker element string
   */
  private static generateArrowMarker(line: KritzelLine, end: 'start' | 'end', _theme?: ThemeName): string {
    const markerId = end === 'start' ? line.startMarkerId : line.endMarkerId;
    const size = line.getArrowSize(end);
    const fill = line.getArrowFill(end);
    const style = end === 'start' ? line.arrows?.start?.style : line.arrows?.end?.style;
    const path = line.getArrowPath(style);
    const orient = end === 'start' ? 'auto-start-reverse' : 'auto';
    const refX = 0;
    const refY = size / 2;

    return `<marker id="${markerId}" markerWidth="${size}" markerHeight="${size}" refX="${refX}" refY="${refY}" orient="${orient}" markerUnits="userSpaceOnUse">
      <path d="${path}" fill="${fill}" transform="scale(${size / 10})"/>
    </marker>`;
  }

  /**
   * Converts a Kritzel object to its SVG element representation.
   * @param object - The object to convert
   * @param theme - Theme for color resolution
   * @param imageDataUrls - Optional map of image id -> inlined data URL
   * @returns SVG element string, or empty string if object type is not supported
   */
  static objectToSvgElement(
    object: KritzelBaseObject,
    theme?: ThemeName,
    imageDataUrls?: Map<string, string>,
    rasterSafeForCanvas: boolean = false,
  ): string {
    if (object instanceof KritzelPath) {
      return this.pathToSvg(object, theme);
    }
    if (object instanceof KritzelLine) {
      return this.lineToSvg(object, theme);
    }
    if (object instanceof KritzelShape) {
      return this.shapeToSvg(object, theme);
    }
    if (object instanceof KritzelText) {
      return this.textToSvg(object, theme, rasterSafeForCanvas);
    }
    if (object instanceof KritzelImage) {
      return this.imageToSvg(object, imageDataUrls);
    }
    if (object instanceof KritzelDynamicObject) {
      return this.dynamicObjectToSvg(object, rasterSafeForCanvas);
    }
    if (object instanceof KritzelIframeObject) {
      return this.iframeObjectToSvg(object);
    }
    if (object instanceof KritzelGroup) {
      return this.groupToSvg(object, theme, imageDataUrls, rasterSafeForCanvas);
    }

    return '';
  }

  /**
   * Converts a KritzelPath to SVG.
   * @param path - The path object
   * @param theme - Theme for color resolution
   * @returns SVG element string
   */
  private static pathToSvg(path: KritzelPath, theme?: ThemeName): string {
    const transform = this.buildTransform(path);
    const fill = KritzelColorHelper.resolveThemeColor(path.fill, theme);
    const stroke = KritzelColorHelper.resolveThemeColor(path.stroke, theme);
    const opacity = path.opacity !== 1 ? ` opacity="${path.opacity}"` : '';
    const scale = this.getObjectScale(path);

    // Path needs to be wrapped in a g with translation since path.d uses local coordinates
    return `<g transform="${transform}"${opacity}>
    <svg viewBox="${path.viewBox}" width="${path.totalWidth / scale}" height="${path.totalHeight / scale}" overflow="visible">
      <path d="${path.d}" fill="${fill || 'none'}" stroke="${stroke || 'none'}"${path.strokeWidth ? ` stroke-width="${path.strokeWidth}"` : ''}/>
    </svg>
  </g>`;
  }

  /**
   * Converts a KritzelLine to SVG.
   * @param line - The line object
   * @param theme - Theme for color resolution
   * @returns SVG element string
   */
  private static lineToSvg(line: KritzelLine, theme?: ThemeName): string {
    const transform = this.buildTransform(line);
    const stroke = KritzelColorHelper.resolveThemeColor(line.stroke, theme);
    const opacity = line.opacity !== 1 ? ` opacity="${line.opacity}"` : '';
    const scale = this.getObjectScale(line);
    
    const markerStart = line.hasStartArrow ? ` marker-start="url(#${line.startMarkerId})"` : '';
    const markerEnd = line.hasEndArrow ? ` marker-end="url(#${line.endMarkerId})"` : '';

    return `<g transform="${transform}"${opacity}>
    <svg viewBox="${line.viewBox}" width="${line.totalWidth / scale}" height="${line.totalHeight / scale}" overflow="visible">
      <path d="${line.d}" fill="none" stroke="${stroke}" stroke-width="${line.strokeWidth}" stroke-linecap="round"${markerStart}${markerEnd}/>
    </svg>
  </g>`;
  }

  /**
   * Converts a KritzelShape to SVG.
   * @param shape - The shape object
   * @param theme - Theme for color resolution
   * @returns SVG element string
   */
  private static shapeToSvg(shape: KritzelShape, theme?: ThemeName): string {
    const transform = this.buildTransform(shape);
    const fill = KritzelColorHelper.resolveThemeColor(shape.fillColor, theme);
    const stroke = KritzelColorHelper.resolveThemeColor(shape.strokeColor, theme);
    const opacity = shape.opacity !== 1 ? ` opacity="${shape.opacity}"` : '';
    const scale = this.getObjectScale(shape);

    // Get the SVG path for the shape
    const pathD = shape.getSvgPath();

    // Handle text content if present
    let textContent = '';
    if (shape.editor && !shape.editor.state.doc.textContent.trim()) {
      // No text content
    } else if (shape.content) {
      const textHtml = this.prosemirrorToHtml(shape.content, shape, theme);
      if (textHtml) {
        const fontColor = KritzelColorHelper.resolveThemeColor(shape.fontColor, theme);
        textContent = `
    <foreignObject x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; font-family: ${shape.fontFamily}; font-size: ${shape.fontSize}px; color: ${fontColor}; overflow: hidden;">
        ${textHtml}
      </div>
    </foreignObject>`;
      }
    }

    return `<g transform="${transform}"${opacity}>
    <svg viewBox="${shape.viewBox}" width="${shape.totalWidth / scale}" height="${shape.totalHeight / scale}" overflow="visible" preserveAspectRatio="none">
      <path d="${pathD}" fill="${fill || 'transparent'}" stroke="${stroke}" stroke-width="${shape.strokeWidth}"/>${textContent}
    </svg>
  </g>`;
  }

  /**
   * Converts a KritzelText to SVG using foreignObject for rich text support.
   * @param text - The text object
   * @param theme - Theme for color resolution
   * @returns SVG element string
   */
  private static textToSvg(text: KritzelText, theme?: ThemeName, rasterSafeForCanvas: boolean = false): string {
    if (rasterSafeForCanvas) {
      return this.textToSvgRasterSafe(text, theme);
    }

    const transform = this.buildTransform(text);
    const opacity = text.opacity !== 1 ? ` opacity="${text.opacity}"` : '';
    const fontColor = KritzelColorHelper.resolveThemeColor(text.fontColor, theme);
    const bgColor = KritzelColorHelper.resolveThemeColor(text.backgroundColor, theme);
    const scale = this.getObjectScale(text);

    // Convert ProseMirror content to HTML
    const htmlContent = this.prosemirrorToHtml(text.content, text, theme);

    // Calculate dimensions in SVG world units (world units = CSS px in a 1:1 SVG).
    const width = text.totalWidth / scale;
    const height = text.totalHeight / scale;

    // Convert the font size from pt to SVG world units (px equivalent).
    // text.fontSize is stored in CSS pt; 1 pt = 4/3 px at 96 dpi.
    // We also bake in scaleFactor (user resize) and divide by the object scale so
    // that the rendered font aligns with the world-unit dimensions above.
    // The CSS transform: scale(scaleFactor) is removed from the div because the
    // adjusted font-size already accounts for it – keeping both would double-scale
    // the content and overflow the foreignObject.
    const svgFontSizePx = (text.fontSize * (4 / 3) * (text.scaleFactor || 1) / scale).toFixed(4);

    return `<g transform="${transform}"${opacity}>
    <foreignObject x="0" y="0" width="${width}" height="${height}" overflow="visible">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: ${text.fontFamily}; font-size: ${svgFontSizePx}px; color: ${fontColor}; background-color: ${bgColor || 'transparent'}; white-space: pre-wrap; word-wrap: break-word; width: 100%; margin: 0; padding: 0; box-sizing: border-box;">${htmlContent.trim()}</div>
    </foreignObject>
  </g>`;
  }

  /**
   * Converts a KritzelText to SVG using pure SVG text primitives.
   * This path avoids `<foreignObject>`, which taints canvases when the
   * generated SVG is rasterized through `<img>` and `drawImage`.
   */
  private static textToSvgRasterSafe(text: KritzelText, theme?: ThemeName): string {
    const transform = this.buildTransform(text);
    const opacity = text.opacity !== 1 ? ` opacity="${text.opacity}"` : '';
    const fontColor = KritzelColorHelper.resolveThemeColor(text.fontColor, theme);
    const bgColor = KritzelColorHelper.resolveThemeColor(text.backgroundColor, theme);
    const scale = this.getObjectScale(text);

    const width = text.totalWidth / scale;
    const height = text.totalHeight / scale;

    const lines = this.prosemirrorToPlainTextLines(text.content);
    const resolvedLines = lines.length > 0 ? lines : [''];

    // Convert the font size from pt to SVG world units (px equivalent).
    // text.fontSize is stored in CSS pt; 1 pt = 4/3 px at 96 dpi.
    // We also bake in scaleFactor (user resize) and divide by the object scale so
    // that the rendered lines align with the world-unit bounding box dimensions above.
    const resolvedFontSizePx = Math.max(1, text.fontSize * (4 / 3) * (text.scaleFactor || 1) / scale);
    const lineHeight = resolvedFontSizePx * 1.2;
    const startY = resolvedFontSizePx;

    const bgRect = bgColor && bgColor !== 'transparent'
      ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}"/>`
      : '';

    const tspans = resolvedLines
      .map((line, index) => {
        const y = startY + index * lineHeight;
        return `<tspan x="0" y="${y}" xml:space="preserve">${this.escapeHtml(line)}</tspan>`;
      })
      .join('');

    return `<g transform="${transform}"${opacity}>
    ${bgRect}
    <text font-family="${this.escapeHtml(text.fontFamily)}" font-size="${resolvedFontSizePx}" fill="${fontColor}">${tspans}</text>
  </g>`;
  }

  /**
   * Converts a KritzelImage to SVG.
   *
   * Prefers an inlined `data:` URL from `imageDataUrls` (keyed by object
   * id) when provided, so the embedded bytes survive rasterization to
   * PNG. Falls back to `resolvedSrc` (populated by the renderer via the
   * asset resolver) and finally the legacy inline `src` field for
   * documents persisted before the asset layer existed.
   *
   * Note: a `blob:` `resolvedSrc` renders correctly on-canvas but becomes
   * a broken-image placeholder once the SVG is loaded into an `<img>` and
   * drawn to a canvas. Callers that rasterize the SVG must pass
   * `imageDataUrls` (see {@link KritzelSvgExportHelper.resolveImageDataUrls}).
   * @param image - The image object
   * @param imageDataUrls - Optional map of image id -> inlined data URL
   * @returns SVG element string
   */
  private static imageToSvg(image: KritzelImage, imageDataUrls?: Map<string, string>): string {
    const transform = this.buildTransform(image);
    const opacity = image.opacity !== 1 ? ` opacity="${image.opacity}"` : '';
    const scale = this.getObjectScale(image);
    
    // Calculate dimensions
    const width = image.totalWidth / scale;
    const height = image.totalHeight / scale;

    const href = imageDataUrls?.get(image.id) || image.resolvedSrc || image.src || '';

    return `<g transform="${transform}"${opacity}>
    <image href="${href}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
  </g>`;
  }

  /**
   * Converts a KritzelDynamicObject to SVG.
   * SVG mode: embeds HTML in foreignObject (best-effort).
   * PNG/raster mode: renders placeholder rect with warning.
   * @param obj - The dynamic object
   * @param rasterSafeForCanvas - If true, render placeholder (for PNG export)
   * @returns SVG element string
   */
  private static dynamicObjectToSvg(obj: KritzelDynamicObject, rasterSafeForCanvas: boolean = false): string {
    const transform = this.buildTransform(obj);
    const opacity = obj.opacity !== 1 ? ` opacity="${obj.opacity}"` : '';
    const scale = this.getObjectScale(obj);
    const width = obj.totalWidth / scale;
    const height = obj.totalHeight / scale;

    if (rasterSafeForCanvas) {
      // PNG export: render placeholder rect (foreignObject doesn't rasterize to PNG well)
      console.warn('[KritzelDynamicObject SVG Export] Dynamic objects do not serialize well to PNG. Use SVG export or screenshot instead.');
      return `<g transform="${transform}"${opacity}>
      <rect x="0" y="0" width="${width}" height="${height}" fill="#f0f0f0" stroke="#999" stroke-width="1" />
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#999">[Dynamic Object]</text>
    </g>`;
    }

    // SVG export: use foreignObject to embed HTML
    const html = obj.element?.outerHTML || '<div style="border:1px dashed #ccc">Empty</div>';
    return `<g transform="${transform}"${opacity}>
      <foreignObject x="0" y="0" width="${width}" height="${height}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;overflow:hidden;">
          ${html}
        </div>
      </foreignObject>
    </g>`;
  }

  private static iframeObjectToSvg(object: KritzelIframeObject): string {
    const transform = this.buildTransform(object);
    const opacity = object.opacity !== 1 ? ` opacity="${object.opacity}"` : '';
    const scale = this.getObjectScale(object);
    const width = object.totalWidth / scale;
    const height = object.totalHeight / scale;

    return `<g transform="${transform}"${opacity}>
      <rect x="0" y="0" width="${width}" height="${height}" fill="#f0f0f0" stroke="#999" stroke-width="1" />
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#999">[Iframe]</text>
    </g>`;
  }

  /**
   * Converts a KritzelGroup to SVG by recursively converting children.
   * @param group - The group object
   * @param theme - Theme for color resolution
   * @param imageDataUrls - Optional map of image id -> inlined data URL
   * @returns SVG element string
   */
  private static groupToSvg(
    group: KritzelGroup,
    theme?: ThemeName,
    imageDataUrls?: Map<string, string>,
    rasterSafeForCanvas: boolean = false,
  ): string {
    const children = group.children
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(child => this.objectToSvgElement(child, theme, imageDataUrls, rasterSafeForCanvas))
      .filter(Boolean)
      .join('\n    ');

    if (!children) {
      return '';
    }

    const opacity = group.opacity !== 1 ? ` opacity="${group.opacity}"` : '';
    
    return `<g${opacity}>
    ${children}
  </g>`;
  }

  /**
   * Builds a transform attribute string for an object.
   * Combines translation and rotation.
   * @param object - The object to build transform for
   * @returns Transform attribute value string
   */
  private static buildTransform(object: KritzelBaseObject): string {
    const transforms: string[] = [];
    const scale = this.getObjectScale(object);

    // Translation
    transforms.push(`translate(${object.translateX}, ${object.translateY})`);

    // Rotation around center
    if (object.rotation !== 0) {
      const centerX = object.totalWidth / 2 / scale;
      const centerY = object.totalHeight / 2 / scale;
      const degrees = object.rotation * (180 / Math.PI);
      transforms.push(`rotate(${degrees}, ${centerX}, ${centerY})`);
    }

    return transforms.join(' ');
  }

  /**
   * Returns a safe non-zero scale for export geometry calculations.
   */
  private static getObjectScale(object: KritzelBaseObject): number {
    const scale = object.scale ?? 1;
    return scale === 0 ? 1 : scale;
  }

  /**
   * Converts ProseMirror JSON content to HTML string.
   * @param content - ProseMirror document JSON
   * @param context - The text or shape object for styling context
   * @param theme - Theme for color resolution
   * @returns HTML string
   */
  private static prosemirrorToHtml(content: any, _context: KritzelText | KritzelShape, theme?: ThemeName): string {
    if (!content || !content.content) {
      return '';
    }

    return content.content
      .map((node: any) => this.nodeToHtml(node, theme))
      .join('');
  }

  /**
   * Converts a ProseMirror node to HTML.
   * @param node - ProseMirror node JSON
   * @param theme - Theme for color resolution
   * @returns HTML string
   */
  private static nodeToHtml(node: any, theme?: ThemeName): string {
    if (!node) return '';

    switch (node.type) {
      case 'paragraph':
        const pContent = node.content ? node.content.map((n: any) => this.nodeToHtml(n, theme)).join('') : '';
        return `<p style="margin: 0;">${pContent || '<br/>'}</p>`;

      case 'text':
        let text = this.escapeHtml(node.text || '');
        if (node.marks) {
          for (const mark of node.marks) {
            text = this.applyMark(text, mark, theme);
          }
        }
        return text;

      case 'hard_break':
        return '<br/>';

      case 'bullet_list':
        const blContent = node.content ? node.content.map((n: any) => this.nodeToHtml(n, theme)).join('') : '';
        return `<ul style="margin: 0; padding-left: 1.5em;">${blContent}</ul>`;

      case 'ordered_list':
        const olContent = node.content ? node.content.map((n: any) => this.nodeToHtml(n, theme)).join('') : '';
        return `<ol style="margin: 0; padding-left: 1.5em;">${olContent}</ol>`;

      case 'list_item':
        const liContent = node.content ? node.content.map((n: any) => this.nodeToHtml(n, theme)).join('') : '';
        return `<li>${liContent}</li>`;

      default:
        // For unknown node types, try to render content
        if (node.content) {
          return node.content.map((n: any) => this.nodeToHtml(n, theme)).join('');
        }
        return '';
    }
  }

  /**
   * Converts ProseMirror JSON content to plain-text lines.
   * Used by raster-safe SVG export, which cannot depend on HTML/foreignObject.
   */
  private static prosemirrorToPlainTextLines(content: any): string[] {
    if (!content || !Array.isArray(content.content)) {
      return [];
    }

    const plainText = content.content
      .map((node: any) => this.nodeToPlainText(node))
      .join('')
      .replace(/\r\n/g, '\n')
      .replace(/\n+$/, '');

    if (!plainText) {
      return [];
    }

    return plainText.split('\n');
  }

  /**
   * Converts a ProseMirror node tree into plain text.
   */
  private static nodeToPlainText(node: any): string {
    if (!node) {
      return '';
    }

    switch (node.type) {
      case 'text':
        return node.text || '';
      case 'hard_break':
        return '\n';
      case 'paragraph': {
        const paragraph = Array.isArray(node.content)
          ? node.content.map((child: any) => this.nodeToPlainText(child)).join('')
          : '';
        return `${paragraph}\n`;
      }
      case 'list_item': {
        const item = Array.isArray(node.content)
          ? node.content.map((child: any) => this.nodeToPlainText(child)).join('')
          : '';
        return `- ${item.trim()}\n`;
      }
      default:
        return Array.isArray(node.content)
          ? node.content.map((child: any) => this.nodeToPlainText(child)).join('')
          : '';
    }
  }

  /**
   * Applies a ProseMirror mark to text.
   * @param text - The text to wrap
   * @param mark - The mark to apply
   * @param theme - Theme for color resolution
   * @returns Wrapped HTML string
   */
  private static applyMark(text: string, mark: any, _theme?: ThemeName): string {
    switch (mark.type) {
      case 'bold':
      case 'strong':
        return `<strong>${text}</strong>`;
      case 'italic':
      case 'em':
        return `<em>${text}</em>`;
      case 'underline':
        return `<u>${text}</u>`;
      case 'strike':
        return `<s>${text}</s>`;
      case 'code':
        return `<code>${text}</code>`;
      case 'link':
        const href = mark.attrs?.href || '#';
        return `<a href="${this.escapeHtml(href)}">${text}</a>`;
      default:
        return text;
    }
  }

  /**
   * Escapes HTML special characters.
   * @param str - String to escape
   * @returns Escaped string
   */
  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
