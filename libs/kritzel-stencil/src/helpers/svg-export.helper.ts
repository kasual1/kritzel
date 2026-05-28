import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelPath } from '../classes/objects/path.class';
import { KritzelLine } from '../classes/objects/line.class';
import { KritzelShape } from '../classes/objects/shape.class';
import { KritzelText } from '../classes/objects/text.class';
import { KritzelImage } from '../classes/objects/image.class';
import { KritzelGroup } from '../classes/objects/group.class';
import { KritzelClassHelper } from './class.helper';
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
    const { theme, padding = 0, includeXmlDeclaration = true } = options;

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
      .map(obj => this.objectToSvgElement(obj, theme))
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
      if (KritzelClassHelper.isInstanceOf<KritzelGroup>(obj, 'KritzelGroup')) {
        result.push(...this.flattenObjects(obj.children));
      } else {
        result.push(obj);
      }
    }
    
    return result;
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
      if (KritzelClassHelper.isInstanceOf<KritzelLine>(obj, 'KritzelLine')) {
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
   * @returns SVG element string, or empty string if object type is not supported
   */
  static objectToSvgElement(object: KritzelBaseObject, theme?: ThemeName): string {
    if (KritzelClassHelper.isInstanceOf<KritzelPath>(object, 'KritzelPath')) {
      return this.pathToSvg(object, theme);
    }
    if (KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine')) {
      return this.lineToSvg(object, theme);
    }
    if (KritzelClassHelper.isInstanceOf<KritzelShape>(object, 'KritzelShape')) {
      return this.shapeToSvg(object, theme);
    }
    if (KritzelClassHelper.isInstanceOf<KritzelText>(object, 'KritzelText')) {
      return this.textToSvg(object, theme);
    }
    if (KritzelClassHelper.isInstanceOf<KritzelImage>(object, 'KritzelImage')) {
      return this.imageToSvg(object);
    }
    if (KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup')) {
      return this.groupToSvg(object, theme);
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

    // Path needs to be wrapped in a g with translation since path.d uses local coordinates
    return `<g transform="${transform}"${opacity}>
    <svg viewBox="${path.viewBox}" width="${path.totalWidth / path.scale}" height="${path.totalHeight / path.scale}" overflow="visible">
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
    
    const markerStart = line.hasStartArrow ? ` marker-start="url(#${line.startMarkerId})"` : '';
    const markerEnd = line.hasEndArrow ? ` marker-end="url(#${line.endMarkerId})"` : '';

    return `<g transform="${transform}"${opacity}>
    <svg viewBox="${line.viewBox}" width="${line.totalWidth / line.scale}" height="${line.totalHeight / line.scale}" overflow="visible">
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
    <svg viewBox="${shape.viewBox}" width="${shape.totalWidth / shape.scale}" height="${shape.totalHeight / shape.scale}" overflow="visible" preserveAspectRatio="none">
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
  private static textToSvg(text: KritzelText, theme?: ThemeName): string {
    const transform = this.buildTransform(text);
    const opacity = text.opacity !== 1 ? ` opacity="${text.opacity}"` : '';
    const fontColor = KritzelColorHelper.resolveThemeColor(text.fontColor, theme);
    const bgColor = KritzelColorHelper.resolveThemeColor(text.backgroundColor, theme);

    // Convert ProseMirror content to HTML
    const htmlContent = this.prosemirrorToHtml(text.content, text, theme);
    
    // Calculate dimensions accounting for scale
    const width = text.totalWidth / text.scale;
    const height = text.totalHeight / text.scale;

    return `<g transform="${transform}"${opacity}>
    <foreignObject x="0" y="0" width="${width}" height="${height}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: ${text.fontFamily}; font-size: ${text.fontSize}pt; color: ${fontColor}; background-color: ${bgColor || 'transparent'}; transform: scale(${text.scaleFactor}); transform-origin: top left; white-space: pre-wrap; word-wrap: break-word;">
        ${htmlContent}
      </div>
    </foreignObject>
  </g>`;
  }

  /**
   * Converts a KritzelImage to SVG.
   *
   * Uses `resolvedSrc` when available (populated by the renderer via the
   * asset resolver), falling back to the legacy inline `src` field for
   * documents persisted before the asset layer existed.
   *
   * Note: SVG export is synchronous and cannot await asset bytes from a
   * remote provider. Callers that need the fully rasterized image bytes
   * embedded in the exported SVG should pre-resolve assets via
   * `core.assetResolver.fetchBlob` and inline them as data URLs.
   * @param image - The image object
   * @returns SVG element string
   */
  private static imageToSvg(image: KritzelImage): string {
    const transform = this.buildTransform(image);
    const opacity = image.opacity !== 1 ? ` opacity="${image.opacity}"` : '';
    
    // Calculate dimensions
    const width = image.totalWidth / image.scale;
    const height = image.totalHeight / image.scale;

    const href = image.resolvedSrc || image.src || '';

    return `<g transform="${transform}"${opacity}>
    <image href="${href}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
  </g>`;
  }

  /**
   * Converts a KritzelGroup to SVG by recursively converting children.
   * @param group - The group object
   * @param theme - Theme for color resolution
   * @returns SVG element string
   */
  private static groupToSvg(group: KritzelGroup, theme?: ThemeName): string {
    const children = group.children
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(child => this.objectToSvgElement(child, theme))
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

    // Translation
    transforms.push(`translate(${object.translateX}, ${object.translateY})`);

    // Rotation around center
    if (object.rotation !== 0) {
      const centerX = object.totalWidth / 2 / object.scale;
      const centerY = object.totalHeight / 2 / object.scale;
      const degrees = object.rotation * (180 / Math.PI);
      transforms.push(`rotate(${degrees}, ${centerX}, ${centerY})`);
    }

    return transforms.join(' ');
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
