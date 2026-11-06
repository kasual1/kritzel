import { Component, Host, Prop, State, h } from '@stencil/core';
import { KritzelCore, KritzelAgenticCursor, KritzelViewportOverlayHelper } from '@kritzel/core';
import { CursorArrow, CursorLabel, EdgeIndicator } from '../shared/cursor/cursor-visuals';

interface RenderedPosition {
  x: number;
  y: number;
  inViewport: boolean;
}

/**
 * Renders agentic cursors managed by `KritzelAgenticCursorManager`, and the outlines of
 * the objects each cursor has selected. Both are local only.
 *
 * Structural changes (added/removed cursors, name, color, status, selections) re-render through
 * Stencil. Per-frame movement of on-screen cursors and outlines is written directly to
 * the elements, so animations and object tracking don't lag a frame behind.
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
  private renderedSelectionKeys = '';
  private removeChangeListener: (() => void) | undefined;
  private removeFrameListener: (() => void) | undefined;

  connectedCallback() {
    const manager = this.core.agenticCursorManager;
    this.removeChangeListener = manager.onChange(() => {
      this.version++;
    });
    this.removeFrameListener = manager.onFrame(() => {
      this.handleFrame();
    });
  }

  disconnectedCallback() {
    this.removeChangeListener?.();
    this.removeChangeListener = undefined;
    this.removeFrameListener?.();
    this.removeFrameListener = undefined;
  }

  private handleFrame() {
    const state = this.core.store.state;
    let needsRender = false;
    const cursorsList = this.core.agenticCursorManager.getAll();

    // Selection outlines follow their objects (drags, remote changes, pan and zoom).
    const selections = this.collectSelections(cursorsList);
    if (selections.map(selection => selection.key).join('|') !== this.renderedSelectionKeys) {
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
    }

    for (const cursor of cursorsList) {
      if (!cursor.visible) continue;

      const screen = KritzelViewportOverlayHelper.worldToScreen(state, cursor.position.x, cursor.position.y);
      const inViewport = KritzelViewportOverlayHelper.isInViewport(state, screen.x, screen.y);
      const previous = this.renderedPositions.get(cursor.id);

      if (previous && previous.x === screen.x && previous.y === screen.y) continue;

      const element = this.cursorElements.get(cursor.id);
      if (inViewport && previous?.inViewport && element) {
        element.style.transform = `translate(${screen.x}px, ${screen.y}px)`;
        this.renderedPositions.set(cursor.id, { x: screen.x, y: screen.y, inViewport });
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
    const cursors = this.core.agenticCursorManager.getAll().filter(cursor => cursor.visible);

    const renderedIds = new Set(cursors.map(cursor => cursor.id));
    for (const id of Array.from(this.renderedPositions.keys())) {
      if (!renderedIds.has(id)) this.renderedPositions.delete(id);
    }

    // Presses made before a cursor was first seen (or while it was hidden) don't ripple later.
    const existingIds = new Set(this.core.agenticCursorManager.getAll().map(cursor => cursor.id));
    for (const id of Array.from(this.playedPressCounts.keys())) {
      if (!existingIds.has(id)) this.playedPressCounts.delete(id);
    }
    for (const cursor of this.core.agenticCursorManager.getAll()) {
      if (!this.playedPressCounts.has(cursor.id)) {
        this.playedPressCounts.set(cursor.id, cursor.isPressed ? cursor.pressCount - 1 : cursor.pressCount);
      } else if (!cursor.visible) {
        this.playedPressCounts.set(cursor.id, cursor.pressCount);
      }
    }

    const selections = this.collectSelections(cursors);
    this.renderedSelectionKeys = selections.map(selection => selection.key).join('|');
    this.renderedSelectionPoints.clear();
    selections.forEach(selection => this.renderedSelectionPoints.set(selection.key, selection.points));

    return (
      <Host>
        {selections.length > 0 && (
          <svg class="agentic-selections" aria-hidden="true">
            {selections.map(selection => (
              <polygon
                key={`agentic-selection-${selection.key}`}
                class="agentic-selection"
                data-cursor-id={selection.cursorId}
                data-object-id={selection.objectId}
                points={selection.points}
                style={{ '--agentic-cursor-color': selection.color }}
                ref={el => this.setSelectionElement(selection.key, el as SVGPolygonElement | undefined)}
              />
            ))}
          </svg>
        )}
        {cursors.map(cursor => {
          const screen = KritzelViewportOverlayHelper.worldToScreen(state, cursor.position.x, cursor.position.y);
          const inViewport = KritzelViewportOverlayHelper.isInViewport(state, screen.x, screen.y);
          this.renderedPositions.set(cursor.id, { x: screen.x, y: screen.y, inViewport });

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

  private renderCursor(cursor: KritzelAgenticCursor, screenX: number, screenY: number) {
    return (
      <div
        key={`agentic-cursor-${cursor.id}`}
        class={{ 'agentic-cursor': true, 'is-moving': cursor.isMoving, 'is-attached': !!cursor.attachedTo, 'is-pressed': cursor.isPressed }}
        data-cursor-id={cursor.id}
        style={{ transform: `translate(${screenX}px, ${screenY}px)`, '--agentic-cursor-color': cursor.color }}
        ref={el => this.setCursorElement(cursor.id, el)}
      >
        {/* Re-keyed on every press so the ripple animation restarts; a played ripple is not rendered again. */}
        {cursor.pressCount > 0 && (cursor.isPressed || cursor.pressCount > (this.playedPressCounts.get(cursor.id) ?? 0)) && (
          <span
            key={`agentic-cursor-ripple-${cursor.pressCount}`}
            class="agentic-cursor-ripple"
            onAnimationEnd={() => this.playedPressCounts.set(cursor.id, cursor.pressCount)}
          ></span>
        )}
        <CursorArrow color={cursor.color} />
        {(cursor.name || cursor.status) && (
          <div class="agentic-cursor-labels">
            {cursor.name && <CursorLabel color={cursor.color} text={cursor.name} />}
            {cursor.status && (
              <span key={`status-${cursor.status}`} class="agentic-cursor-status">
                <span class="agentic-cursor-status-dot"></span>
                {cursor.status}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  private renderEdgeIndicator(cursor: KritzelAgenticCursor, screenX: number, screenY: number) {
    const clamped = KritzelViewportOverlayHelper.clampToEdge(this.core.store.state, screenX, screenY, this.edgeIndicatorPadding);
    return (
      <EdgeIndicator
        indicatorKey={`agentic-edge-${cursor.id}`}
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

  /** Outlines of the objects visible cursors have selected, in screen coordinates. */
  private collectSelections(cursors: KritzelAgenticCursor[]): RenderedSelection[] {
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
        selections.push({ key: `${cursor.id}:${objectId}`, cursorId: cursor.id, objectId, color: cursor.color, points });
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
}
