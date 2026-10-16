import { Component, Host, Prop, State, h } from '@stencil/core';
import { KritzelCore } from '../../classes/core/core.class';
import { KritzelPath } from '../../classes/objects/path.class';
import { KritzelLine } from '../../classes/objects/line.class';
import { KritzelRemoteCursorState } from '../../interfaces/remote-cursor.interface';
import { IKritzelUser } from '../../interfaces/user.interface';
import { KritzelViewportOverlayHelper } from '../../helpers/viewport-overlay.helper';
import { CursorArrow, CursorLabel, EdgeIndicator } from '../shared/cursor/cursor-visuals';

const STALE_THRESHOLD_MS = 10_000;
const REMOVE_THRESHOLD_MS = 30_000;
const CLEANUP_INTERVAL_MS = 3_000;

@Component({
  tag: 'kritzel-awareness-cursors',
  styleUrls: ['../shared/cursor/cursor-visuals.css', 'kritzel-awareness-cursors.css'],
  shadow: true,
})
export class KritzelAwarenessCursors {
  @Prop() core!: KritzelCore;
  @Prop() showEdgeIndicators: boolean = true;
  @Prop() edgeIndicatorPadding: number = 8;

  @State() remoteCursors: Map<number, KritzelRemoteCursorState> = new Map();
  @State() objectVersion: number = 0;

  private cleanupIntervalId: ReturnType<typeof setInterval> | undefined;
  private objectChangeRafId: ReturnType<typeof requestAnimationFrame> | null = null;
  private removeAwarenessChangeListener: (() => void) | undefined;
  private removeObjectsChangeListener: (() => void) | undefined;

  componentDidLoad() {
    this.removeAwarenessChangeListener = this.core.store.objects?.onAwarenessChange(states => {
      this.handleAwarenessChange(states);
    });

    this.removeObjectsChangeListener = this.core.store.objects?.onObjectsChange(() => {
      this.handleRemoteObjectChange();
    });

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupStaleCursors();
    }, CLEANUP_INTERVAL_MS);

    if (this.cleanupIntervalId && typeof this.cleanupIntervalId.unref === 'function') {
      this.cleanupIntervalId.unref();
    }
  }

  disconnectedCallback() {
    if (this.removeAwarenessChangeListener) {
      this.removeAwarenessChangeListener();
      this.removeAwarenessChangeListener = undefined;
    }
    if (this.removeObjectsChangeListener) {
      this.removeObjectsChangeListener();
      this.removeObjectsChangeListener = undefined;
    }
    if (this.cleanupIntervalId && typeof globalThis.clearInterval === 'function') {
      globalThis.clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }
    if (this.objectChangeRafId !== null && typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(this.objectChangeRafId);
      this.objectChangeRafId = null;
    }
  }

  private handleAwarenessChange(states: Map<number, Record<string, unknown>>) {
    const localClientId = this.core.store.objects?.localClientId;
    const now = Date.now();
    const updated = new Map(this.remoteCursors);

    // Track which clientIds are still present
    const activeClientIds = new Set<number>();

    states.forEach((state, clientId) => {
      if (clientId === localClientId) return;
      if (!state.user) return;

      activeClientIds.add(clientId);

      const user = state.user as IKritzelUser;
      const cursor = state.cursor as { x: number; y: number } | null;
      const activeObjectId = (state.activeObjectId as string) || null;
      const selectionBox = (state.selectionBox as { x: number; y: number; width: number; height: number }) || null;

      const existing = updated.get(clientId);
      const cursorMoved =
        !existing ||
        !existing.cursor !== !cursor ||
        (cursor && existing.cursor && (cursor.x !== existing.cursor.x || cursor.y !== existing.cursor.y));

      updated.set(clientId, {
        clientId,
        user,
        cursor,
        activeObjectId,
        selectionBox,
        lastUpdated: now,
        lastCursorMove: cursorMoved ? now : (existing?.lastCursorMove ?? now),
      });
    });

    // Remove cursors for disconnected clients
    for (const clientId of updated.keys()) {
      if (!activeClientIds.has(clientId)) {
        updated.delete(clientId);
      }
    }

    this.remoteCursors = updated;
  }

  private cleanupStaleCursors() {
    const now = Date.now();
    let changed = false;
    const updated = new Map(this.remoteCursors);

    for (const [clientId, cursor] of updated) {
      if (now - cursor.lastUpdated > REMOVE_THRESHOLD_MS) {
        updated.delete(clientId);
        changed = true;
      } else if (!changed && now - cursor.lastCursorMove > STALE_THRESHOLD_MS) {
        changed = true;
      }
    }

    if (changed) {
      this.remoteCursors = updated;
    }
  }

  private isStale(cursor: KritzelRemoteCursorState): boolean {
    return Date.now() - cursor.lastCursorMove > STALE_THRESHOLD_MS;
  }

  private hasActiveDrawingCursors(): boolean {
    for (const cursor of this.remoteCursors.values()) {
      if (cursor.activeObjectId) return true;
    }
    return false;
  }

  private handleRemoteObjectChange(): void {
    if (!this.hasActiveDrawingCursors()) return;

    // Debounce via rAF to batch multiple rapid Yjs updates into a single re-render
    if (this.objectChangeRafId !== null) return;
    this.objectChangeRafId = requestAnimationFrame(() => {
      this.objectChangeRafId = null;
      this.objectVersion++;
    });
  }

  private getActiveObjectTip(objectId: string): { x: number; y: number } | null {
    const obj = this.core.store.objects?.findById(objectId);
    if (!obj) return null;

    if (obj instanceof KritzelPath && !obj.isCompleted) {
      const lastPoint = obj.points[obj.points.length - 1];
      if (!lastPoint) return null;
      return {
        x: (lastPoint[0] - obj.x) / obj.scale + obj.translateX,
        y: (lastPoint[1] - obj.y) / obj.scale + obj.translateY,
      };
    }

    if (obj instanceof KritzelLine && !obj.isCompleted) {
      return {
        x: (obj.endX - obj.x) / obj.scale + obj.translateX,
        y: (obj.endY - obj.y) / obj.scale + obj.translateY,
      };
    }

    // Shapes normalize their bounding box (x/y always top-left, width/height
    // always positive), so we can't determine which corner the user is actively
    // dragging. Fall back to the throttled awareness cursor position instead.

    return null;
  }

  private worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return KritzelViewportOverlayHelper.worldToScreen(this.core.store.state, worldX, worldY);
  }

  private isInViewport(screenX: number, screenY: number): boolean {
    return KritzelViewportOverlayHelper.isInViewport(this.core.store.state, screenX, screenY);
  }

  private getUserDisplayName(user: IKritzelUser): string {
    if (user.displayName) return user.displayName;
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    return 'Unknown';
  }

  render() {
    // Read reactive viewport state so Stencil re-renders on pan/zoom
    const _scale = this.core.store.state.scale;
    const _tx = this.core.store.state.translateX;
    const _ty = this.core.store.state.translateY;

    // Suppress unused variable warnings — these reads trigger Stencil reactivity
    void _scale;
    void _tx;
    void _ty;
    void this.objectVersion;

    const cursors = Array.from(this.remoteCursors.values());

    return (
      <Host>
        {cursors.map(remoteCursor => {
          if (!remoteCursor.cursor) return null;

          // When a remote user is actively drawing, derive cursor position from
          // the object's latest coordinates (synced via Yjs) instead of the
          // throttled awareness cursor position
          let screen: { x: number; y: number };
          let trackingObject = false;
          if (remoteCursor.activeObjectId) {
            const tip = this.getActiveObjectTip(remoteCursor.activeObjectId);
            if (tip) {
              trackingObject = true;
              screen = this.worldToScreen(tip.x, tip.y);
            } else {
              screen = this.worldToScreen(remoteCursor.cursor.x, remoteCursor.cursor.y);
            }
          } else {
            screen = this.worldToScreen(remoteCursor.cursor.x, remoteCursor.cursor.y);
          }

          const inViewport = this.isInViewport(screen.x, screen.y);
          const stale = this.isStale(remoteCursor);
          const color = remoteCursor.user.color || '#6B7280';

          if (inViewport) {
            return this.renderCursor(remoteCursor, screen.x, screen.y, color, stale, trackingObject);
          }

          if (this.showEdgeIndicators) {
            return this.renderEdgeIndicator(remoteCursor, screen.x, screen.y, color, stale, trackingObject);
          }

          return null;
        })}
        {cursors.map(remoteCursor => {
          if (!remoteCursor.selectionBox) return null;

          const color = remoteCursor.user.color || '#6B7280';
          const box = remoteCursor.selectionBox;
          const topLeft = this.worldToScreen(box.x, box.y);
          const { scale } = this.core.store.state;
          const screenWidth = box.width * scale;
          const screenHeight = box.height * scale;

          return (
            <div
              key={`selection-box-${remoteCursor.clientId}`}
              class="remote-selection-box"
              style={{
                transform: `translate(${topLeft.x}px, ${topLeft.y}px)`,
                width: `${screenWidth}px`,
                height: `${screenHeight}px`,
                backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
              }}
            ></div>
          );
        })}
      </Host>
    );
  }

  private renderCursor(
    cursor: KritzelRemoteCursorState,
    screenX: number,
    screenY: number,
    color: string,
    stale: boolean,
    trackingObject: boolean,
  ) {
    return (
      <div
        key={`cursor-${cursor.clientId}`}
        class={{ 'awareness-cursor': true, stale, 'tracking-object': trackingObject }}
        style={{ transform: `translate(${screenX}px, ${screenY}px)` }}
      >
        <CursorArrow color={color} />
        <CursorLabel color={color} text={this.getUserDisplayName(cursor.user)} />
      </div>
    );
  }

  private renderEdgeIndicator(
    cursor: KritzelRemoteCursorState,
    screenX: number,
    screenY: number,
    color: string,
    stale: boolean,
    trackingObject: boolean,
  ) {
    const clamped = KritzelViewportOverlayHelper.clampToEdge(this.core.store.state, screenX, screenY, this.edgeIndicatorPadding);
    const displayName = this.getUserDisplayName(cursor.user);

    return (
      <EdgeIndicator
        indicatorKey={`edge-${cursor.clientId}`}
        x={clamped.x}
        y={clamped.y}
        angle={clamped.angle}
        edge={clamped.edge}
        color={color}
        label={KritzelViewportOverlayHelper.getInitials(displayName)}
        classes={{ stale, 'tracking-object': trackingObject }}
      />
    );
  }
}
