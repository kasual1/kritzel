import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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
  KritzelViewportState,
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

interface GalleryImageEntry {
  image: KritzelImage;
  centerX: number;
  centerY: number;
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

function generateArtworks(count: number): ArtworkDef[] {
  const rng = seededRng(42);
  const artworks: ArtworkDef[] = [];

  // Sunflower / golden-angle spiral: even non-clustering distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const spread = 6000;

  for (let i = 0; i < count; i++) {
    const r = spread * Math.sqrt((i + 0.5) / count);
    const angle = i * goldenAngle;
    const jitterX = (rng() - 0.5) * 700;
    const jitterY = (rng() - 0.5) * 700;

    const x = Math.round(r * Math.cos(angle) + jitterX);
    const y = Math.round(r * Math.sin(angle) + jitterY);

    // Pieces further from origin feel more distant
    const normR = r / spread;
    const depth = Math.max(
      0.15,
      Math.min(1.0, 1.0 - normR * 0.78 + (rng() - 0.5) * 0.2),
    );

    // Mix portrait and landscape
    const isPortrait = rng() > 0.5;
    const baseW = Math.round(360 + rng() * 180);
    const baseH = isPortrait
      ? Math.round(baseW * (1.25 + rng() * 0.35))
      : Math.round(baseW * (0.58 + rng() * 0.3));

    const palette = PALETTES[Math.floor(rng() * PALETTES.length)];
    const baseTitle = BASE_TITLES[i % BASE_TITLES.length];
    const suffix =
      i >= BASE_TITLES.length
        ? ` ${Math.floor(i / BASE_TITLES.length) + 1}`
        : '';
    const title = baseTitle + suffix;

    artworks.push({ title, w: baseW, h: baseH, x, y, depth, ...palette });
  }

  return artworks;
}

const ARTWORKS: ArtworkDef[] = generateArtworks(100);

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
        [controls]="controls"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady()"
        (viewportChange)="onViewportChange($event)"
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
export class InfiniteCanvasGalleryComponent implements OnDestroy {
  private static readonly MIN_IMAGE_OPACITY = 0.16;
  private static readonly MAX_IMAGE_OPACITY = 1.0;
  private static readonly FADE_NEAR_DISTANCE = 260;
  private static readonly FADE_FAR_DISTANCE = 1650;
  private static readonly OPACITY_EPSILON = 0.015;

  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private galleryImages: GalleryImageEntry[] = [];
  private rafHandle: number | null = null;
  private pendingViewport: KritzelViewportState | null = null;
  private isOpacityUpdateInFlight = false;
  private queuedViewportAfterFlight: KritzelViewportState | null = null;

  themes = [customAngularTheme];
  artworkCount = signal(0);

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

  ngOnDestroy(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  async onReady(): Promise<void> {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.seedGallery();
    } else {
      this.artworkCount.set(existing.length);
    }
    // Zoom out to reveal the full scattered gallery
    await this.editor.setViewport(0, 0, 0.18);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>): void {
    this.pendingViewport = event.detail;
    if (this.rafHandle !== null) {
      return;
    }

    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      if (this.pendingViewport) {
        void this.updateImageOpacities(this.pendingViewport);
      }
    });
  }

  private async seedGallery(): Promise<void> {
    const seededImages = await Promise.all(
      ARTWORKS.map((art) => {
        // Apply depth to actual pixel dimensions: close = full size, far = tiny
        const scaledW = Math.round(art.w * art.depth);
        const scaledH = Math.round(art.h * art.depth);
        const label = art.title.replace(/ /g, '+').replace(/&/g, 'and');
        const src = `https://placehold.co/${scaledW}x${scaledH}/${art.bg}/${art.fg}?text=${label}`;
        return KritzelImage.fromUrl(src, {
          translateX: art.x,
          translateY: art.y,
          maxWidth: scaledW,
          maxHeight: scaledH,
        }).then((image) => ({
          image,
          centerX: art.x + scaledW / 2,
          centerY: art.y + scaledH / 2,
        }));
      }),
    );

    this.galleryImages = seededImages;

    for (let i = 0; i < seededImages.length; i++) {
      const entry = seededImages[i];
      entry.image.isEditable = false;
      entry.image.opacity = InfiniteCanvasGalleryComponent.MIN_IMAGE_OPACITY;
      await this.editor.addObject(entry.image);
    }

    this.artworkCount.set(seededImages.length);
  }

  private async updateImageOpacities(viewport: KritzelViewportState): Promise<void> {
    if (this.isOpacityUpdateInFlight) {
      this.queuedViewportAfterFlight = viewport;
      return;
    }

    this.isOpacityUpdateInFlight = true;
    try {
      const updatedEntries: GalleryImageEntry[] = [];

      for (const entry of this.galleryImages) {
        const distance = Math.hypot(
          entry.centerX - viewport.translateX,
          entry.centerY - viewport.translateY,
        );
        const opacity = this.opacityFromDistance(
          distance * Math.max(viewport.scale, 0.001),
        );

        if (
          Math.abs((entry.image.opacity ?? 1) - opacity) >=
          InfiniteCanvasGalleryComponent.OPACITY_EPSILON
        ) {
          entry.image.opacity = opacity;
          updatedEntries.push(entry);
        }
      }

      if (updatedEntries.length > 0) {
        await Promise.all(
          updatedEntries.map((entry) =>
            this.editor.updateObject(entry.image, { opacity: entry.image.opacity }),
          ),
        );
      }
    } finally {
      this.isOpacityUpdateInFlight = false;
    }

    if (this.queuedViewportAfterFlight) {
      const nextViewport = this.queuedViewportAfterFlight;
      this.queuedViewportAfterFlight = null;
      await this.updateImageOpacities(nextViewport);
    }
  }

  private opacityFromDistance(distance: number): number {
    const near = InfiniteCanvasGalleryComponent.FADE_NEAR_DISTANCE;
    const far = InfiniteCanvasGalleryComponent.FADE_FAR_DISTANCE;
    const raw = (distance - near) / (far - near);
    const clamped = Math.max(0, Math.min(1, raw));
    const smooth = clamped * clamped * (3 - 2 * clamped);
    const fade = 1 - smooth;
    return (
      InfiniteCanvasGalleryComponent.MIN_IMAGE_OPACITY +
      fade *
        (InfiniteCanvasGalleryComponent.MAX_IMAGE_OPACITY -
          InfiniteCanvasGalleryComponent.MIN_IMAGE_OPACITY)
    );
  }
}
