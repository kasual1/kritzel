import { useRef, type CSSProperties } from "react";
import {
  KritzelEditor,
  KritzelImage,
  type HTMLKritzelEditorElement,
  type KritzelViewportState,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";

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

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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

const hostStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  fontFamily: "Inter, Segoe UI, sans-serif",
  background:
    "radial-gradient(circle at top left, rgba(8, 126, 164, 0.12), transparent 32%), linear-gradient(180deg, rgba(245, 250, 252, 1) 0%, rgba(235, 246, 250, 1) 100%)",
  color: "#16313c",
};

const canvasWrapperStyle: CSSProperties = {
  flex: 1,
  position: "relative",
};

const editorStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

export function InfiniteCanvasGalleryPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  const nodesByRegion = useRef(new Map<string, VirtualImageNode[]>());
  const nodesById = useRef(new Map<number, VirtualImageNode>());
  const mountedNodeIds = useRef(new Set<number>());

  const isReady = useRef(false);
  const isViewportUpdateInProgress = useRef(false);
  const pendingViewport = useRef<KritzelViewportState | null>(null);
  const lastViewportRegionSignature = useRef("");

  function generateVirtualDataset() {
    if (nodesById.current.size > 0) {
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

      nodesById.current.set(node.id, node);
      const key = regionKey(toRegionIndex(node.x), toRegionIndex(node.y));
      const bucket = nodesByRegion.current.get(key);
      if (bucket) {
        bucket.push(node);
      } else {
        nodesByRegion.current.set(key, [node]);
      }
    }
  }

  async function syncVisibleObjects(viewport: KritzelViewportState) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const worldTopLeft = await editor.screenToWorld(0, 0);
    const worldBottomRight = await editor.screenToWorld(viewport.width, viewport.height);

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
    if (signature === lastViewportRegionSignature.current) {
      return;
    }
    lastViewportRegionSignature.current = signature;

    const desiredNodeIds = new Set<number>();

    for (let regionX = minRegionX; regionX <= maxRegionX; regionX++) {
      for (let regionY = minRegionY; regionY <= maxRegionY; regionY++) {
        const bucket = nodesByRegion.current.get(regionKey(regionX, regionY));
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
    for (const mountedNodeId of mountedNodeIds.current) {
      if (desiredNodeIds.has(mountedNodeId)) {
        continue;
      }
      const node = nodesById.current.get(mountedNodeId);
      if (node) {
        nodesToRemove.push(node);
      }
    }

    const nodesToAdd: VirtualImageNode[] = [];
    for (const nodeId of desiredNodeIds) {
      if (mountedNodeIds.current.has(nodeId)) {
        continue;
      }
      const node = nodesById.current.get(nodeId);
      if (node) {
        nodesToAdd.push(node);
      }
    }

    if (nodesToRemove.length > 0) {
      await editor.removeObjects(nodesToRemove.map((node) => node.object));
      for (const node of nodesToRemove) {
        mountedNodeIds.current.delete(node.id);
      }
    }

    if (nodesToAdd.length > 0) {
      await editor.addObjects(nodesToAdd.map((node) => node.object));
      for (const node of nodesToAdd) {
        mountedNodeIds.current.add(node.id);
      }
    }
  }

  async function flushViewportUpdates() {
    try {
      while (pendingViewport.current) {
        const viewport = pendingViewport.current;
        pendingViewport.current = null;
        await syncVisibleObjects(viewport);
      }
    } finally {
      isViewportUpdateInProgress.current = false;
    }
  }

  function scheduleViewportUpdate(viewport: KritzelViewportState) {
    pendingViewport.current = viewport;

    if (isViewportUpdateInProgress.current) {
      return;
    }

    isViewportUpdateInProgress.current = true;

    requestAnimationFrame(() => {
      void flushViewportUpdates();
    });
  }

  async function onReady() {
    if (isReady.current) {
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    isReady.current = true;

    const existing = await editor.getAllObjects();
    if (existing.length > 0) {
      await editor.removeObjects(existing);
    }

    generateVirtualDataset();

    const initialViewport = await editor.getViewport();
    scheduleViewportUpdate(initialViewport);
  }

  function onViewportChange(viewport: KritzelViewportState) {
    if (!isReady.current) {
      return;
    }

    scheduleViewportUpdate(viewport);
  }

  return (
    <div style={hostStyle}>
      <div style={canvasWrapperStyle}>
        <KritzelEditor
          ref={editorRef}
          editorId="infinite-canvas-gallery"
          theme="react-theme"
          themes={[customReactTheme]}
          isMoreMenuVisible={true}
          isWorkspaceManagerVisible={false}
          isObjectDistanceFadingActive={true}
          onIsReady={() => {
            void onReady();
          }}
          onViewportChange={(event: CustomEvent<KritzelViewportState>) => {
            onViewportChange((event as CustomEvent<KritzelViewportState>).detail);
          }}
          style={editorStyle}
        />
      </div>
    </div>
  );
}
