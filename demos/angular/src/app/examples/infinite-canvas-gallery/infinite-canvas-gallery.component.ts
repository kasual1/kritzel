import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  signal,
} from '@angular/core';
import {
  KritzelEditor,
  KritzelSelectionTool,
  KritzelToolbarControl,
  InMemorySyncProvider,
  KritzelSyncConfig,
  KritzelImage,
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

interface ArtworkDef {
  title: string;
  w: number;
  h: number;
  x: number;
  y: number;
  /** 0–1: 1 = close/large, 0 = far/tiny */
  depth: number;
  bg: string;
  fg: string;
}

interface GalleryBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Seeded pseudo-random generator (mulberry32) — same layout every render
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
  };
}


const PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: '1d3557', fg: 'ffffff' },
  { bg: 'c1440e', fg: 'ffffff' },
  { bg: '2d6a4f', fg: 'ffffff' },
  { bg: '6a0572', fg: 'ffffff' },
  { bg: 'e63946', fg: 'ffffff' },
  { bg: '0077b6', fg: 'ffffff' },
  { bg: 'f4a261', fg: '3d3d3d' },
  { bg: '3d3d3d', fg: 'ffffff' },
  { bg: 'd4a5a5', fg: '3d3d3d' },
  { bg: '1a1a2e', fg: 'ffffff' },
  { bg: 'c8b8a2', fg: '3d3d3d' },
  { bg: 'f4e9d9', fg: '3d3d3d' },
  { bg: '457b9d', fg: 'ffffff' },
  { bg: 'e9c46a', fg: '3d3d3d' },
  { bg: '264653', fg: 'ffffff' },
  { bg: '2a9d8f', fg: 'ffffff' },
];

const BASE_TITLES = [
  'The Shore',
  'Evening Portrait',
  'Still Life',
  'Mountain Mist',
  'Figure Study',
  'Sunset Fields',
  'Abstract',
  'The Dancer',
  'City Lights',
  'Geometric',
  'Watercolors',
  'The Soloist',
  'Harbor Scene',
  'Spring Bloom',
  'Winter Walk',
  'Self Portrait',
  'The River',
  'The Orchard',
  'Red Dress',
  'Garden Path',
  'Nocturne',
  'Arcadia',
  'Crimson Wave',
  'Cobalt Dreams',
  'Ivory Coast',
  'Violet Hour',
  'Rust and Gold',
  'The Expanse',
  'Dust and Light',
  'Cerulean Study',
  'Ember',
  'The Void',
  'Open Waters',
  'Reverie',
  'Grey Study',
  'First Light',
  'Autumn',
  'Passage',
  'Solstice',
  'Meridian',
  'Undertow',
  'Bloom',
  'The Hilltop',
  'Penumbra',
  'Cascade',
  'Terra',
  'Umber',
  'Equinox',
  'Study in Blue',
  'The Crossing',
];

// Sector-based layout inspired by the chunk-based infinite canvas approach
// (see tympanus.net/codrops/2026/01/07/infinite-canvas-building-a-seamless-pan-anywhere-image-space/):
// divide the canvas into equal sectors and scatter images fully randomly within each
// sector — avoids the regular-grid look while keeping even coverage across the canvas.
function generateCuboidArtworks(count: number): ArtworkDef[] {
  const rng = seededRng(42);
  const artworks: ArtworkDef[] = [];

  const cols = 8;
  const rows = 6;
  const width = 10000;
  const height = 8000;
  const sectorW = width / cols;   // 1250
  const sectorH = height / rows;  // ~1333

  // Discrete depth tiers create clear foreground / midground / background planes
  // rather than a continuous gradient that blurs perceived depth.
  const depthLevels = [0.50, 0.68, 0.84, 1.0];

  for (let row = 0; row < rows && artworks.length < count; row++) {
    for (let col = 0; col < cols && artworks.length < count; col++) {
      const sectorLeft = -width / 2 + col * sectorW;
      const sectorTop = -height / 2 + row * sectorH;

      // 4–6 images per sector (article uses ~5 planes per chunk)
      const sectorCount = 4 + Math.floor(rng() * 3);

      for (let i = 0; i < sectorCount && artworks.length < count; i++) {
        // Fully random position within sector — the key insight from the article.
        // Equivalent to: cx * CHUNK_SIZE + r(0) * CHUNK_SIZE
        const x = Math.round(sectorLeft + rng() * sectorW);
        const y = Math.round(sectorTop + rng() * sectorH);

        // Pick a random depth tier — not tied to grid layer, so nearby images
        // can have very different depths, creating natural visual layering.
        const depth = depthLevels[Math.floor(rng() * depthLevels.length)];

        const isPortrait = rng() > 0.47;
        // Wider size range (200–560) for stronger visual rhythm
        const baseW = Math.round(200 + rng() * 360);
        const baseH = isPortrait
          ? Math.round(baseW * (1.2 + rng() * 0.5))
          : Math.round(baseW * (0.55 + rng() * 0.35));

        const palette = PALETTES[Math.floor(rng() * PALETTES.length)];
        const idx = artworks.length;
        const baseTitle = BASE_TITLES[idx % BASE_TITLES.length];
        const suffix = idx >= BASE_TITLES.length ? ` ${Math.floor(idx / BASE_TITLES.length) + 1}` : '';

        artworks.push({ title: baseTitle + suffix, w: baseW, h: baseH, x, y, depth, ...palette });
      }
    }
  }

  return artworks;
}

function computeGalleryBounds(artworks: ArtworkDef[]): GalleryBounds {
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const art of artworks) {
    const scaledW = Math.max(80, Math.round(art.w * art.depth));
    const scaledH = Math.max(80, Math.round(art.h * art.depth));
    left = Math.min(left, art.x - scaledW / 2);
    right = Math.max(right, art.x + scaledW / 2);
    top = Math.min(top, art.y - scaledH / 2);
    bottom = Math.max(bottom, art.y + scaledH / 2);
  }

  const padding = 520;
  return {
    left: Math.floor(left - padding),
    right: Math.ceil(right + padding),
    top: Math.floor(top - padding),
    bottom: Math.ceil(bottom + padding),
  };
}

const ARTWORKS: ArtworkDef[] = generateCuboidArtworks(200);
const GALLERY_BOUNDS = computeGalleryBounds(ARTWORKS);

@Component({
  selector: 'app-infinite-canvas-gallery',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="gallery-header">
      <div class="brand">
        <span class="badge">Infinite Canvas</span>
        <h1 class="title">Art Gallery</h1>
      </div>
      <p class="hint">
        Pan to explore · Scroll to zoom · {{ artworkCount() }} artworks
      </p>
    </header>

    <div class="canvas-wrapper">
      <kritzel-editor
        editorId="infinite-canvas-gallery"
        [theme]="'angular-theme'"
        [themes]="themes"
        [syncConfig]="syncConfig"
        [viewportBoundaryLeft]="bounds.left"
        [viewportBoundaryRight]="bounds.right"
        [viewportBoundaryTop]="bounds.top"
        [viewportBoundaryBottom]="bounds.bottom"
        [controls]="controls"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        [isObjectDistanceFadingActive]="true"
        [scaleMin]="0.12"
        (isReady)="onReady()"
      ></kritzel-editor>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: Roboto, sans-serif;
      background: #f5f5f0;
    }

    .gallery-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      background: #ffffff;
      border-bottom: 1px solid #e8e8e8;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(221, 0, 48, 0.1);
      color: #dd0031;
      padding: 2px 8px;
      border-radius: 99px;
    }

    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .hint {
      margin: 0;
      font-size: 13px;
      color: #888888;
    }

    .canvas-wrapper {
      flex: 1;
      position: relative;
    }

    kritzel-editor {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class InfiniteCanvasGalleryComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly initialViewportScale = 0.22;

  themes = [customAngularTheme];
  artworkCount = signal(0);
  bounds = GALLERY_BOUNDS;

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      isDefault: true,
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
  ];

  async onReady(): Promise<void> {
    // Set the viewport BEFORE seeding. The engine stamps each added object with
    // object.scale = currentViewportScale. Fading uses normalizedScale =
    // viewportScale / objectScale — seeding at scale 0.22 means the ratio is
    // 1.0 at the initial view (fully visible) and only fades when zooming below
    // that level, rather than being nearly invisible from the start.
    await this.editor.setViewport(0, 0, this.initialViewportScale);

    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.seedGallery();
    } else {
      this.artworkCount.set(existing.length);
    }
  }

  private async seedGallery(): Promise<void> {
    const byDepth = new Map<number, ArtworkDef[]>();
    for (const art of ARTWORKS) {
      if (!byDepth.has(art.depth)) {
        byDepth.set(art.depth, []);
      }
      byDepth.get(art.depth)?.push(art);
    }

    const depths = Array.from(byDepth.keys()).sort((a, b) => a - b);
    let created = 0;

    for (const depth of depths) {
      const arts = byDepth.get(depth) ?? [];
      // Aggressive bias: farther layers get even larger object.scale so they
      // drop out earlier and foreground layers remain visually dominant.
      const stampScale = (this.initialViewportScale / Math.max(depth, 0.1)) * 1.35;
      await this.editor.setViewport(0, 0, stampScale);

      const seededImages = await Promise.all(
        arts.map((art) => {
          const scaledW = Math.max(80, Math.round(art.w * art.depth));
          const scaledH = Math.max(80, Math.round(art.h * art.depth));
          const label = art.title.replace(/ /g, '+').replace(/&/g, 'and');
          const src = `https://placehold.co/${scaledW}x${scaledH}/${art.bg}/${art.fg}?text=${label}`;
          return KritzelImage.fromUrl(src, {
            translateX: art.x,
            translateY: art.y,
            maxWidth: scaledW,
            maxHeight: scaledH,
          });
        }),
      );

      for (let i = 0; i < seededImages.length; i++) {
        const image = seededImages[i];
        image.isEditable = false;
        await this.editor.addObject(image);
      }

      created += seededImages.length;
    }

    await this.editor.setViewport(0, 0, this.initialViewportScale);
    this.artworkCount.set(created);
  }
}
