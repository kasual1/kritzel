import { Component, Host, Prop, State, h } from '@stencil/core';
import { KritzelCore } from '../../../classes/core/core.class';
import { KritzelRemoteCursorState } from '../../../interfaces/remote-cursor.interface';
import { IKritzelUser } from '../../../interfaces/user.interface';

const STALE_THRESHOLD_MS = 10_000;
const REMOVE_THRESHOLD_MS = 30_000;
const CLEANUP_INTERVAL_MS = 3_000;

@Component({
  tag: 'kritzel-awareness-cursors',
  styleUrl: 'kritzel-awareness-cursors.css',
  shadow: true,
})
export class KritzelAwarenessCursors {
  @Prop() core: KritzelCore;
  @Prop() showEdgeIndicators: boolean = true;
  @Prop() edgeIndicatorPadding: number = 8;

  @State() remoteCursors: Map<number, KritzelRemoteCursorState> = new Map();

  private cleanupIntervalId: ReturnType<typeof setInterval>;

  componentDidLoad() {
    this.core.store.state.objects?.onAwarenessChange(states => {
      this.handleAwarenessChange(states);
    });

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupStaleCursors();
    }, CLEANUP_INTERVAL_MS);
  }

  disconnectedCallback() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
  }

  private handleAwarenessChange(states: Map<number, Record<string, unknown>>) {
    const localClientId = this.core.store.state.objects?.localClientId;
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

      updated.set(clientId, {
        clientId,
        user,
        cursor,
        lastUpdated: now,
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
      }
    }

    if (changed) {
      this.remoteCursors = updated;
    }
  }

  private isStale(cursor: KritzelRemoteCursorState): boolean {
    return Date.now() - cursor.lastUpdated > STALE_THRESHOLD_MS;
  }

  private worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const { scale, translateX, translateY } = this.core.store.state;
    return {
      x: worldX * scale + translateX,
      y: worldY * scale + translateY,
    };
  }

  private isInViewport(screenX: number, screenY: number): boolean {
    const { viewportWidth, viewportHeight } = this.core.store.state;
    return screenX >= 0 && screenX <= viewportWidth && screenY >= 0 && screenY <= viewportHeight;
  }

  private clampToEdge(screenX: number, screenY: number): { x: number; y: number; angle: number; edge: string } {
    const { viewportWidth, viewportHeight } = this.core.store.state;
    const padding = this.edgeIndicatorPadding; // 8px

    // Clamp symmetrically
    const clampedX = Math.max(padding, Math.min(viewportWidth - padding, screenX));
    const clampedY = Math.max(padding, Math.min(viewportHeight - padding, screenY));

    // Determine nearest edge to position avatar inside
    const distLeft = clampedX - padding;
    const distRight = (viewportWidth - padding) - clampedX;
    const distTop = clampedY - padding;
    const distBottom = (viewportHeight - padding) - clampedY;

    let edge = 'top';
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    if (minDist === distLeft) edge = 'left';
    else if (minDist === distRight) edge = 'right';
    else if (minDist === distTop) edge = 'top';
    else edge = 'bottom';

    const angle = Math.atan2(screenY - clampedY, screenX - clampedX);

    return { x: clampedX, y: clampedY, angle, edge };
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

    const cursors = Array.from(this.remoteCursors.values());

    return (
      <Host>
        {cursors.map(remoteCursor => {
          if (!remoteCursor.cursor) return null;

          const screen = this.worldToScreen(remoteCursor.cursor.x, remoteCursor.cursor.y);
          const inViewport = this.isInViewport(screen.x, screen.y);
          const stale = this.isStale(remoteCursor);
          const color = remoteCursor.user.color || '#6B7280';

          if (inViewport) {
            return this.renderCursor(remoteCursor, screen.x, screen.y, color, stale);
          }

          if (this.showEdgeIndicators) {
            return this.renderEdgeIndicator(remoteCursor, screen.x, screen.y, color, stale);
          }

          return null;
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
  ) {
    return (
      <div
        key={`cursor-${cursor.clientId}`}
        class={{ 'awareness-cursor': true, stale }}
        style={{ transform: `translate(${screenX}px, ${screenY}px)` }}
      >
        <svg
          class="cursor-arrow"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 3L19 12L12 13L9 20L5 3Z"
            fill={color}
            stroke="#ffffff"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
        <span
          class="cursor-label"
          style={{ backgroundColor: color }}
        >
          {this.getUserDisplayName(cursor.user)}
        </span>
      </div>
    );
  }

  private renderEdgeIndicator(
    cursor: KritzelRemoteCursorState,
    screenX: number,
    screenY: number,
    color: string,
    stale: boolean,
  ) {
    const clamped = this.clampToEdge(screenX, screenY);
    const arrowDeg = (clamped.angle * 180) / Math.PI + 90;

    // Position the username label opposite to the edge
    const labelOffset = 20;
    let labelX = 0;
    let labelY = 0;
    
    // Default transform origin is somewhat arbitrary without explicit layout
    // We'll calculate simple translations relative to center point
    if (clamped.edge === 'left') {
      labelX = labelOffset;
    } else if (clamped.edge === 'right') {
      labelX = -labelOffset;
    } else if (clamped.edge === 'top') {
      labelY = labelOffset;
    } else if (clamped.edge === 'bottom') {
      labelY = -labelOffset;
    }

    const displayName = this.getUserDisplayName(cursor.user);

    return (
      <div
        key={`edge-${cursor.clientId}`}
        class={{ 'edge-indicator': true, stale }}
        style={{
          transform: `translate(${clamped.x}px, ${clamped.y}px)`,
        }}
      >
        <svg
          class="edge-arrow"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{ transform: `rotate(${arrowDeg}deg)` }}
        >
          <path
            d="M8 1L14 13H2L8 1Z"
            fill={color}
            stroke="#ffffff"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
        <span
          class="edge-label"
          style={{ 
            backgroundColor: color,
            transform: `translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {displayName}
        </span>
      </div>
    );
  }
}
