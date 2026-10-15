import { Component, Host, Prop, State, h } from '@stencil/core';
import { KritzelCore } from '../../classes/core/core.class';
import { KritzelAgenticCursor } from '../../interfaces/agentic-cursor.interface';
import { KritzelViewportOverlayHelper } from '../../helpers/viewport-overlay.helper';
import { CursorArrow, CursorLabel, EdgeIndicator } from '../shared/cursor/cursor-visuals';

interface RenderedPosition {
  x: number;
  y: number;
  inViewport: boolean;
}

/**
 * Renders agentic cursors managed by `KritzelAgenticCursorManager`.
 *
 * Structural changes (added/removed cursors, name, color, status) re-render through
 * Stencil. Per-frame movement of on-screen cursors writes the transform directly to
 * the cursor element, so animations and object tracking don't lag a frame behind.
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

    for (const cursor of this.core.agenticCursorManager.getAll()) {
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

    return (
      <Host>
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
        class={{ 'agentic-cursor': true, 'is-moving': cursor.isMoving, 'is-attached': !!cursor.attachedTo }}
        data-cursor-id={cursor.id}
        style={{ transform: `translate(${screenX}px, ${screenY}px)`, '--agentic-cursor-color': cursor.color }}
        ref={el => this.setCursorElement(cursor.id, el)}
      >
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
}
