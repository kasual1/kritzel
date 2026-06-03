import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  InMemorySyncProvider,
  KritzelSyncConfig,
  KritzelImage,
  EditorIsReadyEvent,
  KritzelViewportState,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';

const TOTAL_IMAGES = 4000;
const CLUSTER_RADIUS = 14000;
const MIN_IMAGE_SCALE = 0.9;
const MAX_IMAGE_SCALE = 60;
const BASE_IMAGE_SIZE = 220;
const REGION_SIZE = 5400;
const OVERSCAN_SCREENS = 1;
const XY_SPREAD_FACTOR = 0.35;
const Z_SPREAD_FACTOR = 1.25;

type VirtualImageNode = {
  id: number;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  object: KritzelImage;
};

const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toRegionIndex = (value: number): number => Math.floor(value / REGION_SIZE);

const regionKey = (x: number, y: number): string => `${x}:${y}`;

const depthToScale = (z: number): number => {
  const normalizedDepth = clamp((z + CLUSTER_RADIUS) / (2 * CLUSTER_RADIUS), 0, 1);
  const minLog = Math.log(MIN_IMAGE_SCALE);
  const maxLog = Math.log(MAX_IMAGE_SCALE);
  return Math.exp(minLog + normalizedDepth * (maxLog - minLog));
};

const pointInSphere = (index: number, count: number) => {
  const normalizedIndex = (index + 0.5) / count;
  const radial = Math.cbrt(normalizedIndex) * CLUSTER_RADIUS;
  const cosine = 1 - 2 * pseudoRandom(index * 0.61803398875 + 1);
  const sine = Math.sqrt(1 - cosine * cosine);
  const theta = 2 * Math.PI * pseudoRandom(index * 1.32471795724 + 7);

  return {
    x: radial * sine * Math.cos(theta) * XY_SPREAD_FACTOR,
    y: radial * sine * Math.sin(theta) * XY_SPREAD_FACTOR,
    z: radial * cosine * Z_SPREAD_FACTOR,
  };
};

@Component({
  selector: 'app-infinite-canvas-gallery',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="canvas-wrapper">
      <kritzel-editor
        editorId="infinite-canvas-gallery"
        [theme]="'angular-theme'"
        [themes]="themes"
        [syncConfig]="syncConfig"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="true"
        [isWorkspaceManagerVisible]="false"
        [isObjectDistanceFadingActive]="true"
        (isReady)="onIsReady($event)"
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
export class InfiniteCanvasGalleryComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly nodesByRegion = new Map<string, VirtualImageNode[]>();
  private readonly nodesById = new Map<number, VirtualImageNode>();
  private readonly mountedNodeIds = new Set<number>();

  private isReady = false;
  private isViewportUpdateInProgress = false;
  private pendingViewport: KritzelViewportState | null = null;
  private lastViewportRegionSignature = '';

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    if (this.isReady) {
      return;
    }

    this.isReady = true;

    const existing = await this.editor.getAllObjects();
    if (existing.length > 0) {
      await this.editor.removeObjects(existing);
    }

    this.generateVirtualDataset();

    const initialViewport = await this.editor.getViewport();
    this.scheduleViewportUpdate(initialViewport);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    if (!this.isReady) {
      return;
    }

    this.scheduleViewportUpdate(event.detail);
  }

  private scheduleViewportUpdate(viewport: KritzelViewportState) {
    this.pendingViewport = viewport;

    if (this.isViewportUpdateInProgress) {
      return;
    }

    this.isViewportUpdateInProgress = true;

    requestAnimationFrame(() => {
      void this.flushViewportUpdates();
    });
  }

  private async flushViewportUpdates() {
    try {
      while (this.pendingViewport) {
        const viewport = this.pendingViewport;
        this.pendingViewport = null;
        await this.syncVisibleObjects(viewport);
      }
    } finally {
      this.isViewportUpdateInProgress = false;
    }
  }

  private generateVirtualDataset() {
    if (this.nodesById.size > 0) {
      return;
    }

    for (let index = 0; index < TOTAL_IMAGES; index++) {
      const point = pointInSphere(index, TOTAL_IMAGES);
      const scale = depthToScale(point.z);
      const sizeJitter = 0.8 + pseudoRandom(index * 19.31 + 3) * 0.5;
      const width = BASE_IMAGE_SIZE * sizeJitter;
      const height = BASE_IMAGE_SIZE * sizeJitter;
      const imageId = 100 + (index % 900);
      const object = new KritzelImage({
        src: `https://picsum.photos/id/${imageId}/500/500`,
        translateX: point.x,
        translateY: point.y,
        width,
        height,
        scale,
      });

      const node: VirtualImageNode = {
        id: index,
        x: point.x,
        y: point.y,
        z: point.z,
        width,
        height,
        object,
      };

      this.nodesById.set(node.id, node);
      const key = regionKey(toRegionIndex(node.x), toRegionIndex(node.y));
      const bucket = this.nodesByRegion.get(key);
      if (bucket) {
        bucket.push(node);
      } else {
        this.nodesByRegion.set(key, [node]);
      }
    }
  }

  private async syncVisibleObjects(viewport: KritzelViewportState) {
    const worldTopLeft = await this.editor.screenToWorld(0, 0);
    const worldBottomRight = await this.editor.screenToWorld(viewport.width, viewport.height);

    const minX = Math.min(worldTopLeft.x, worldBottomRight.x);
    const maxX = Math.max(worldTopLeft.x, worldBottomRight.x);
    const minY = Math.min(worldTopLeft.y, worldBottomRight.y);
    const maxY = Math.max(worldTopLeft.y, worldBottomRight.y);

    const overscanX = (maxX - minX) * OVERSCAN_SCREENS;
    const overscanY = (maxY - minY) * OVERSCAN_SCREENS;

    const expandedMinX = minX - overscanX;
    const expandedMaxX = maxX + overscanX;
    const expandedMinY = minY - overscanY;
    const expandedMaxY = maxY + overscanY;

    const minRegionX = toRegionIndex(expandedMinX);
    const maxRegionX = toRegionIndex(expandedMaxX);
    const minRegionY = toRegionIndex(expandedMinY);
    const maxRegionY = toRegionIndex(expandedMaxY);

    const signature = `${minRegionX}:${maxRegionX}:${minRegionY}:${maxRegionY}`;
    if (signature === this.lastViewportRegionSignature) {
      return;
    }
    this.lastViewportRegionSignature = signature;

    const desiredNodeIds = new Set<number>();

    for (let regionX = minRegionX; regionX <= maxRegionX; regionX++) {
      for (let regionY = minRegionY; regionY <= maxRegionY; regionY++) {
        const bucket = this.nodesByRegion.get(regionKey(regionX, regionY));
        if (!bucket) {
          continue;
        }

        for (const node of bucket) {
          const halfWidth = node.width / 2;
          const halfHeight = node.height / 2;
          if (
            node.x + halfWidth < expandedMinX ||
            node.x - halfWidth > expandedMaxX ||
            node.y + halfHeight < expandedMinY ||
            node.y - halfHeight > expandedMaxY
          ) {
            continue;
          }
          desiredNodeIds.add(node.id);
        }
      }
    }

    const nodesToRemove: VirtualImageNode[] = [];
    for (const mountedNodeId of this.mountedNodeIds) {
      if (desiredNodeIds.has(mountedNodeId)) {
        continue;
      }
      const node = this.nodesById.get(mountedNodeId);
      if (node) {
        nodesToRemove.push(node);
      }
    }

    const nodesToAdd: VirtualImageNode[] = [];
    for (const nodeId of desiredNodeIds) {
      if (this.mountedNodeIds.has(nodeId)) {
        continue;
      }
      const node = this.nodesById.get(nodeId);
      if (node) {
        nodesToAdd.push(node);
      }
    }

    if (nodesToRemove.length > 0) {
      await this.editor.removeObjects(nodesToRemove.map(node => node.object));
      for (const node of nodesToRemove) {
        this.mountedNodeIds.delete(node.id);
      }
    }

    if (nodesToAdd.length > 0) {
      await this.editor.addObjects(nodesToAdd.map(node => node.object));
      for (const node of nodesToAdd) {
        this.mountedNodeIds.add(node.id);
      }
    }
  }
}
