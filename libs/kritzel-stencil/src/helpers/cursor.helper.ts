import { KritzelIconRegistry } from '../classes/registries/icon-registry.class';

export class KritzelCursorHelper {
  private static _pointerCursor: string | null = null;

  /**
   * Returns the custom pointer cursor CSS value.
   * This can be used instead of `cursor: pointer` for consistent styling.
   */
  static getPointerCursor(): string {
    if (!this._pointerCursor) {
      this._pointerCursor = this.getCursor({ iconName: 'pointer' });
    }
    return this._pointerCursor;
  }

  /**
   * Returns a custom cursor CSS value with support for rotation.
   * The icon is retrieved from the KritzelIconRegistry.
   */
  static getCursor(
    options: {
      iconName: string;
      rotation?: number;
      color?: string;
      size?: number;
      hotspot?: { x: number; y: number };
    }
  ): string {
    const iconName = options.iconName === 'default' ? 'mouse-pointer' : options.iconName;
    const iconSvg = KritzelIconRegistry.get(iconName);
    if (!iconSvg) {
      console.warn(`Icon "${iconName}" not found in registry.`);
      return 'auto';
    }

    const size = options.size || 24;
    const rotation = options.rotation || 0;
    const color = options.color || 'black';
    // Default cursor (mouse-pointer) has hotspot at (4, 4), others at center
    const hotspot = options.hotspot || (options.iconName === 'default' ? { x: 4, y: 4 } : { x: size / 2, y: size / 2 });

    // Modify the SVG string to set size and color
    // We replace width and height to match the requested size
    // We replace currentColor with the requested color
    let content = iconSvg
        .replace(/width="\d+"/, `width="${size}"`)
        .replace(/height="\d+"/, `height="${size}"`)
        .replace(/currentColor/g, color);

    // Create the SVG string
    // We rotate around the center of the SVG canvas
    const center = size / 2;
    
    // We use a group to apply the rotation
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <g transform="rotate(${rotation} ${center} ${center})">
          ${content}
        </g>
      </svg>
    `;

    // Encode the SVG for use in a data URI
    // We need to be careful with encoding to ensure it works across browsers
    const encodedSvg = encodeURIComponent(svg.replace(/\s+/g, ' ').trim())
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');

    const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

    // Return the cursor style string
    return `url('${dataUri}') ${hotspot.x} ${hotspot.y}, auto`;
  }
}
