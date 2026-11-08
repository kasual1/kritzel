import { Component, Host, Prop, State, h, writeTask } from '@stencil/core';
import { KritzelCore, KritzelAgenticCursor, KritzelLine, KritzelPoint, KritzelViewportOverlayHelper } from '@kritzel/core';
import { CursorArrow, CursorLabel, EdgeIndicator } from '../shared/cursor/cursor-visuals';

/** A cursor to draw: a local agent (key = its ID) or a collaborator's agent (key = `r:<client>:<id>`). */
type DrawnCursor = KritzelAgenticCursor & { key: string; isRemote?: boolean };

interface RenderedPosition {
  x: number;
  y: number;
  inViewport: boolean;
}

/** Size of the engine's selection handles when `--kritzel-selection-handle-size` is not set. */
const DEFAULT_HANDLE_SIZE_PX = 6;

/**
 * Renders the cursors of the local agents (`KritzelAgenticCursorManager`) and of collaborators' agents
 * (`KritzelRemoteAgentManager`), the outlines of the objects each agent has selected and, like a person's
 * selection of one object, its rotation handle. Everything is keyed by the cursor key, so the same agent ID
 * in two tabs never collides.
 *
 * Structural changes (added/removed cursors, name, color, status, selections) re-render through
 * Stencil. Per-frame movement of on-screen cursors, outlines and handles is written directly to the
 * elements, in Stencil's write phase: the engine renders objects there too, so an outline is drawn in
 * the same frame as the object state it follows and never runs ahead of the object.
 */
@Component({
  tag: 'kritzel-agentic-cursors',
  styleUrls: ['../shared/cursor/cursor-visuals.css', 'kritzel-agentic-cursors.css'],
  shadow: true,
})
export class KritzelAgenticCursors {
  @Prop() core!: KritzelCore;
  @Prop() showEdgeIndicators: boolean = true;
  @Prop() edgeIndicatorPadding: number = 8;

  @State() version: number = 0;

  private readonly cursorElements = new Map<string, HTMLElement>();
  private readonly renderedPositions = new Map<string, RenderedPosition>();
  private readonly selectionElements = new Map<string, SVGPolygonElement>();
  /** Press count whose ripple has played per cursor, so re-created cursor elements don't replay it. */
  private readonly playedPressCounts = new Map<string, number>();
  private readonly renderedSelectionPoints = new Map<string, string>();
  private readonly handleElements = new Map<string, { stem?: SVGLineElement; knob?: SVGCircleElement }>();
  private readonly renderedHandleGeometry = new Map<string, string>();
  /** Keys of the rendered outlines and handles; a change re-renders. */
  private renderedSelectionKeys = '';
  private unsubscribers: (() => void)[] = [];
  /** Whether a frame is waiting for Stencil's write phase; both managers' frame loops share it. */
  private isFrameQueued = false;

  connectedCallback() {
    const local = this.core.agenticCursorManager;
    const remote = this.core.remoteAgentManager;
    const onChange = () => {
      this.version++;
    };
    // Both managers run frame loops. A frame only writes positions that changed, so a second call is cheap.
    const onFrame = () => this.handleFrame();
    this.unsubscribers = [local.onChange(onChange), local.onFrame(onFrame)];
    if (remote) {
      this.unsubscribers.push(remote.onChange(onChange), remote.onFrame(onFrame));
    }
  }

  disconnectedCallback() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  /** Local cursors first, then collaborators' agents. */
  private getCursors(): DrawnCursor[] {
    const local: DrawnCursor[] = this.core.agenticCursorManager.getAll().map(cursor => ({ ...cursor, key: cursor.id }));
    const remote: DrawnCursor[] = this.core.remoteAgentManager?.getAll() ?? [];
    return [...local, ...remote];
  }

  /**
   * Queues the frame for Stencil's next write phase instead of writing right away. Agent actions change
   * objects in the cursor loop, and the engine renders those changes in that write phase; writing now
   * would draw outlines, handles and cursors one frame ahead of the objects they belong to.
   */
  private handleFrame() {
    if (this.isFrameQueued) return;
    this.isFrameQueued = true;
    writeTask(() => {
      this.isFrameQueued = false;
      // Removed before the write phase: nothing to draw.
      if (this.unsubscribers.length > 0) this.writeFrame();
    });
  }

  private writeFrame() {
    const state = this.core.store.state;
    let needsRender = false;
    const cursorsList = this.getCursors();

    // Selection outlines and handles follow their objects (drags, remote changes, pan and zoom).
    const selections = this.collectSelections(cursorsList);
    const handles = this.collectRotationHandles(cursorsList);
    if (this.getSelectionKeys(selections, handles) !== this.renderedSelectionKeys) {
      needsRender = true;
    } else {
      for (const selection of selections) {
        if (this.renderedSelectionPoints.get(selection.key) === selection.points) continue;
        const element = this.selectionElements.get(selection.key);
        if (element) {
          element.setAttribute('points', selection.points);
          this.renderedSelectionPoints.set(selection.key, selection.points);
        } else {
          needsRender = true;
        }
      }
      for (const handle of handles) {
        if (this.renderedHandleGeometry.get(handle.key) === handle.geometry) continue;
        const { stem, knob } = this.handleElements.get(handle.key) ?? {};
        if (stem && knob) {
          stem.setAttribute('x1', `${handle.x1}`);
          stem.setAttribute('y1', `${handle.y1}`);
          stem.setAttribute('x2', `${handle.x2}`);
          stem.setAttribute('y2', `${handle.y2}`);
          knob.setAttribute('cx', `${handle.x2}`);
          knob.setAttribute('cy', `${handle.y2}`);
          this.renderedHandleGeometry.set(handle.key, handle.geometry);
        } else {
          needsRender = true;
        }
      }
    }

    for (const cursor of cursorsList) {
      if (!cursor.visible) continue;

      const screen = KritzelViewportOverlayHelper.worldToScreen(state, cursor.position.x, cursor.position.y);
      const inViewport = KritzelViewportOverlayHelper.isInViewport(state, screen.x, screen.y);
      const previous = this.renderedPositions.get(cursor.key);

      if (previous && previous.x === screen.x && previous.y === screen.y) continue;

      const element = this.cursorElements.get(cursor.key);
      if (inViewport && previous?.inViewport && element) {
        element.style.transform = `translate(${screen.x}px, ${screen.y}px)`;
        this.renderedPositions.set(cursor.key, { x: screen.x, y: screen.y, inViewport });
      } else {
        needsRender = true;
      }
    }

    if (needsRender) {
      this.version++;
    }
  }

  render() {
    void this.version;
    const state = this.core.store.state;
    const all = this.getCursors();
    const cursors = all.filter(cursor => cursor.visible);

    const renderedKeys = new Set(cursors.map(cursor => cursor.key));
    for (const key of Array.from(this.renderedPositions.keys())) {
      if (!renderedKeys.has(key)) this.renderedPositions.delete(key);
    }

    // Presses made before a cursor was first seen (or while it was hidden) don't ripple later.
    const existingKeys = new Set(all.map(cursor => cursor.key));
    for (const key of Array.from(this.playedPressCounts.keys())) {
      if (!existingKeys.has(key)) this.playedPressCounts.delete(key);
    }
    for (const cursor of all) {
      if (!this.playedPressCounts.has(cursor.key)) {
        this.playedPressCounts.set(cursor.key, cursor.isPressed ? cursor.pressCount - 1 : cursor.pressCount);
      } else if (!cursor.visible) {
        this.playedPressCounts.set(cursor.key, cursor.pressCount);
      }
    }

    const selections = this.collectSelections(cursors);
    const handles = this.collectRotationHandles(cursors);
    this.renderedSelectionKeys = this.getSelectionKeys(selections, handles);
    this.renderedSelectionPoints.clear();
    selections.forEach(selection => this.renderedSelectionPoints.set(selection.key, selection.points));
    this.renderedHandleGeometry.clear();
    handles.forEach(handle => this.renderedHandleGeometry.set(handle.key, handle.geometry));
    const handleRadius = handles.length > 0 ? this.getHandleRadius() : 0;

    return (
      <Host>
        {(selections.length > 0 || handles.length > 0) && (
          <svg class="agentic-selections" aria-hidden="true">
            {selections.map(selection => (
              <polygon
                key={`agentic-selection-${selection.key}`}
                class={{ 'agentic-selection': true, 'is-remote': selection.isRemote }}
                data-cursor-id={selection.cursorId}
                data-object-id={selection.objectId}
                points={selection.points}
                style={{ '--agentic-cursor-color': selection.color }}
                ref={el => this.setSelectionElement(selection.key, el as SVGPolygonElement | undefined)}
              />
            ))}
            {/* After the outlines, so a handle is never hidden behind another agent's outline. */}
            {handles.map(handle => (
              <g
                key={`agentic-rotation-handle-${handle.key}`}
                class={{ 'agentic-rotation-handle': true, 'is-remote': handle.isRemote }}
                data-cursor-id={handle.cursorId}
                data-object-id={handle.objectId}
                style={{ '--agentic-cursor-color': handle.color }}
              >
                <line
                  class="agentic-rotation-handle-stem"
                  x1={handle.x1}
                  y1={handle.y1}
                  x2={handle.x2}
                  y2={handle.y2}
                  ref={el => this.setHandleElement(handle.key, 'stem', el as SVGLineElement | undefined)}
                />
                <circle
                  class="agentic-rotation-handle-knob"
                  cx={handle.x2}
                  cy={handle.y2}
                  r={handleRadius}
                  ref={el => this.setHandleElement(handle.key, 'knob', el as SVGCircleElement | undefined)}
                />
              </g>
            ))}
          </svg>
        )}
        {cursors.map(cursor => {
          const screen = KritzelViewportOverlayHelper.worldToScreen(state, cursor.position.x, cursor.position.y);
          const inViewport = KritzelViewportOverlayHelper.isInViewport(state, screen.x, screen.y);
          this.renderedPositions.set(cursor.key, { x: screen.x, y: screen.y, inViewport });

          if (inViewport) {
            return this.renderCursor(cursor, screen.x, screen.y);
          }
          if (this.showEdgeIndicators) {
            return this.renderEdgeIndicator(cursor, screen.x, screen.y);
          }
          return null;
        })}
      </Host>
    );
  }

  private renderCursor(cursor: DrawnCursor, screenX: number, screenY: number) {
    return (
      <div
        key={`agentic-cursor-${cursor.key}`}
        class={{
          'agentic-cursor': true,
          'is-moving': cursor.isMoving,
          'is-attached': !!cursor.attachedTo,
          'is-pressed': cursor.isPressed,
          'is-remote': !!cursor.isRemote,
        }}
        data-cursor-id={cursor.id}
        style={{ transform: `translate(${screenX}px, ${screenY}px)`, '--agentic-cursor-color': cursor.color }}
        ref={el => this.setCursorElement(cursor.key, el)}
      >
        {/* Re-keyed on every press so the ripple animation restarts; a played ripple is not rendered again. */}
        {cursor.pressCount > 0 && (cursor.isPressed || cursor.pressCount > (this.playedPressCounts.get(cursor.key) ?? 0)) && (
          <span
            key={`agentic-cursor-ripple-${cursor.pressCount}`}
            class="agentic-cursor-ripple"
            onAnimationEnd={() => this.playedPressCounts.set(cursor.key, cursor.pressCount)}
          ></span>
        )}
        <CursorArrow color={cursor.color} />
        {(cursor.name || cursor.status) && (
          <div class="agentic-cursor-labels">
            {cursor.name && <CursorLabel color={cursor.color} text={cursor.name} />}
            {/* One element for every status: a new text doesn't replay the entry animation. */}
            {cursor.status && (
              <span key="status" class="agentic-cursor-status" title={cursor.status}>
                <span class="agentic-cursor-status-dot"></span>
                <span class="agentic-cursor-status-text">{cursor.status}</span>
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  private renderEdgeIndicator(cursor: DrawnCursor, screenX: number, screenY: number) {
    const clamped = KritzelViewportOverlayHelper.clampToEdge(this.core.store.state, screenX, screenY, this.edgeIndicatorPadding);
    return (
      <EdgeIndicator
        indicatorKey={`agentic-edge-${cursor.key}`}
        x={clamped.x}
        y={clamped.y}
        angle={clamped.angle}
        edge={clamped.edge}
        color={cursor.color}
        label={cursor.name ? KritzelViewportOverlayHelper.getInitials(cursor.name) : '•'}
        classes={{ 'agentic-edge-indicator': true }}
      />
    );
  }

  private setCursorElement(id: string, element: HTMLElement | undefined) {
    if (element) {
      this.cursorElements.set(id, element);
    } else {
      this.cursorElements.delete(id);
    }
  }

  private setSelectionElement(key: string, element: SVGPolygonElement | undefined) {
    if (element) {
      this.selectionElements.set(key, element);
    } else {
      this.selectionElements.delete(key);
    }
  }

  private setHandleElement(key: string, part: 'stem' | 'knob', element: SVGLineElement | SVGCircleElement | undefined) {
    const elements = this.handleElements.get(key) ?? {};
    if (element) {
      (elements as Record<string, SVGElement>)[part] = element;
      this.handleElements.set(key, elements);
      return;
    }
    delete elements[part];
    if (!elements.stem && !elements.knob) {
      this.handleElements.delete(key);
    }
  }

  private getSelectionKeys(selections: RenderedSelection[], handles: RenderedRotationHandle[]): string {
    return [...selections.map(selection => selection.key), ...handles.map(handle => `handle:${handle.key}`)].join('|');
  }

  /** Radius of the handle in screen pixels, the same as the engine's rotation handle. */
  private getHandleRadius(): number {
    const host = this.core.engine?.host;
    const size = host && typeof getComputedStyle === 'function' ? parseFloat(getComputedStyle(host).getPropertyValue('--kritzel-selection-handle-size')) : NaN;
    return (Number.isFinite(size) && size > 1 ? size : DEFAULT_HANDLE_SIZE_PX) - 1;
  }

  /**
   * Rotation handles of the visible cursors, in screen coordinates. Like a person's selection, a cursor shows one
   * when it has exactly one rotatable object selected that is not a line (lines show their endpoints instead).
   * While an agent rotates an object, the object always shows its handle.
   */
  private collectRotationHandles(cursors: DrawnCursor[]): RenderedRotationHandle[] {
    const state = this.core.store.state;
    const objects = this.core.store.objects;
    const handles: RenderedRotationHandle[] = [];
    if (!objects) return handles;

    for (const cursor of cursors) {
      if (!cursor.visible || cursor.selectedObjectIds.length !== 1) continue;
      const objectId = cursor.selectedObjectIds[0];
      const object = objects.findById(objectId);
      if (!object) continue;
      const isRotating = cursor.activeAction === 'rotateObject';
      if (!isRotating && (object instanceof KritzelLine || !this.core.objectConfigManager.isRotatable(object))) continue;

      const handle = this.core.agenticCursorManager.getRotationHandle(objectId);
      if (!handle) continue;
      const center = this.isOnHandle(cursor, objectId) ? this.followCursor(handle.base, handle.handle, cursor.position) : handle.handle;

      const base = KritzelViewportOverlayHelper.worldToScreen(state, handle.base.x, handle.base.y);
      const knob = KritzelViewportOverlayHelper.worldToScreen(state, center.x, center.y);
      const [x1, y1, x2, y2] = [base.x, base.y, knob.x, knob.y].map(value => Math.round(value * 100) / 100);
      handles.push({
        key: `${cursor.key}:${objectId}`,
        cursorId: cursor.id,
        objectId,
        color: cursor.color,
        isRemote: !!cursor.isRemote,
        x1,
        y1,
        x2,
        y2,
        geometry: `${x1},${y1},${x2},${y2}`,
      });
    }
    return handles;
  }

  /**
   * Whether the cursor holds the object's rotation handle: pressed while rotating, or resting on it afterwards
   * (attached straight above the middle of the top edge, where the rotate action leaves it).
   */
  private isOnHandle(cursor: DrawnCursor, objectId: string): boolean {
    if (cursor.activeAction === 'rotateObject' && cursor.isPressed) return true;
    const attached = cursor.attachedTo;
    return !!attached && attached.objectId === objectId && attached.selector === undefined && attached.anchor === 'top' && attached.offset.x === 0 && attached.offset.y < 0;
  }

  /**
   * A handle the cursor holds is under the cursor. The agent grabbed it at the zoom (and titlebar) of the tab it
   * runs in, so on a collaborator's screen, or after zooming, the handle slides along its stem to the cursor.
   */
  private followCursor(base: KritzelPoint, handle: KritzelPoint, cursor: KritzelPoint): KritzelPoint {
    const dx = handle.x - base.x;
    const dy = handle.y - base.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return handle;
    const along = ((cursor.x - base.x) * dx + (cursor.y - base.y) * dy) / length;
    if (!(along > 0)) return handle;
    return { x: base.x + (dx / length) * along, y: base.y + (dy / length) * along };
  }

  /** Outlines of the objects visible cursors have selected, in screen coordinates. */
  private collectSelections(cursors: DrawnCursor[]): RenderedSelection[] {
    const state = this.core.store.state;
    const objects = this.core.store.objects;
    const selections: RenderedSelection[] = [];
    if (!objects) return selections;

    for (const cursor of cursors) {
      if (!cursor.visible || cursor.selectedObjectIds.length === 0) continue;
      for (const objectId of cursor.selectedObjectIds) {
        const object = objects.findById(objectId);
        if (!object) continue;
        const polygon = object.rotatedPolygon;
        const points = [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft]
          .map(corner => {
            const screen = KritzelViewportOverlayHelper.worldToScreen(state, corner.x, corner.y);
            return `${Math.round(screen.x * 100) / 100},${Math.round(screen.y * 100) / 100}`;
          })
          .join(' ');
        selections.push({ key: `${cursor.key}:${objectId}`, cursorId: cursor.id, objectId, color: cursor.color, points, isRemote: !!cursor.isRemote });
      }
    }
    return selections;
  }
}

interface RenderedSelection {
  key: string;
  cursorId: string;
  objectId: string;
  color: string;
  points: string;
  isRemote: boolean;
}

interface RenderedRotationHandle {
  key: string;
  cursorId: string;
  objectId: string;
  color: string;
  isRemote: boolean;
  /** Screen point where the stem leaves the top edge. */
  x1: number;
  y1: number;
  /** Screen point of the handle's center. */
  x2: number;
  y2: number;
  /** The four coordinates, to skip frames in which nothing moved. */
  geometry: string;
}
