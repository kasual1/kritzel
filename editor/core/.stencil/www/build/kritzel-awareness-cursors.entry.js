import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';
import { e as KritzelPath, a as KritzelLine } from './path.class-DavJ_cvx.js';
import './_commonjsHelpers-i-KAFXlR.js';

const kritzelAwarenessCursorsCss = () => `:host{display:block;position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:1}.awareness-cursor{position:absolute;top:0;left:0;transition:transform var(--kritzel-awareness-cursor-transition-duration, 100ms) ease-out,               opacity 300ms ease;will-change:transform}.awareness-cursor.stale{opacity:0}.awareness-cursor.tracking-object{transition-duration:0ms}.cursor-arrow{filter:drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))}.cursor-label{position:absolute;left:16px;top:16px;white-space:nowrap;font-family:var(--kritzel-awareness-font-family, var(--kritzel-global-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif));font-size:var(--kritzel-awareness-cursor-label-font-size, 12px);color:var(--kritzel-awareness-cursor-label-text-color, #ffffff);padding:2px 8px;border-radius:4px;line-height:1.4;font-weight:500;pointer-events:none;user-select:none}.edge-indicator{position:absolute;top:-12px;left:-12px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;transition:transform var(--kritzel-awareness-cursor-transition-duration, 100ms) ease-out,               opacity 300ms ease;will-change:transform;pointer-events:auto;user-select:none;cursor:pointer}.edge-indicator.stale{opacity:0}.edge-indicator.tracking-object{transition-duration:0ms}.edge-arrow{position:absolute;filter:drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));transition:opacity 300ms ease}.edge-arrow.stale{opacity:0}.edge-label{position:absolute;white-space:nowrap;font-family:var(--kritzel-awareness-font-family, var(--kritzel-global-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif));font-size:var(--kritzel-awareness-cursor-label-font-size, 12px);color:var(--kritzel-awareness-cursor-label-text-color, #ffffff);padding:2px 8px;border-radius:4px;line-height:1.4;font-weight:500;pointer-events:none;opacity:0;transform-origin:center;transition:opacity 150ms ease}.edge-indicator:hover .edge-label{opacity:1}.remote-selection-box{position:absolute;top:0;left:0;border-width:2px;border-style:solid;pointer-events:none;will-change:transform, width, height;transition:transform var(--kritzel-awareness-cursor-transition-duration, 100ms) ease-out,               width var(--kritzel-awareness-cursor-transition-duration, 100ms) ease-out,               height var(--kritzel-awareness-cursor-transition-duration, 100ms) ease-out}`;

const STALE_THRESHOLD_MS = 10_000;
const REMOVE_THRESHOLD_MS = 30_000;
const CLEANUP_INTERVAL_MS = 3_000;
const KritzelAwarenessCursors = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    core;
    showEdgeIndicators = true;
    edgeIndicatorPadding = 8;
    remoteCursors = new Map();
    objectVersion = 0;
    cleanupIntervalId;
    objectChangeRafId = null;
    removeAwarenessChangeListener;
    removeObjectsChangeListener;
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
    handleAwarenessChange(states) {
        const localClientId = this.core.store.objects?.localClientId;
        const now = Date.now();
        const updated = new Map(this.remoteCursors);
        // Track which clientIds are still present
        const activeClientIds = new Set();
        states.forEach((state, clientId) => {
            if (clientId === localClientId)
                return;
            if (!state.user)
                return;
            activeClientIds.add(clientId);
            const user = state.user;
            const cursor = state.cursor;
            const activeObjectId = state.activeObjectId || null;
            const selectionBox = state.selectionBox || null;
            const existing = updated.get(clientId);
            const cursorMoved = !existing ||
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
    cleanupStaleCursors() {
        const now = Date.now();
        let changed = false;
        const updated = new Map(this.remoteCursors);
        for (const [clientId, cursor] of updated) {
            if (now - cursor.lastUpdated > REMOVE_THRESHOLD_MS) {
                updated.delete(clientId);
                changed = true;
            }
            else if (!changed && now - cursor.lastCursorMove > STALE_THRESHOLD_MS) {
                changed = true;
            }
        }
        if (changed) {
            this.remoteCursors = updated;
        }
    }
    isStale(cursor) {
        return Date.now() - cursor.lastCursorMove > STALE_THRESHOLD_MS;
    }
    hasActiveDrawingCursors() {
        for (const cursor of this.remoteCursors.values()) {
            if (cursor.activeObjectId)
                return true;
        }
        return false;
    }
    handleRemoteObjectChange() {
        if (!this.hasActiveDrawingCursors())
            return;
        // Debounce via rAF to batch multiple rapid Yjs updates into a single re-render
        if (this.objectChangeRafId !== null)
            return;
        this.objectChangeRafId = requestAnimationFrame(() => {
            this.objectChangeRafId = null;
            this.objectVersion++;
        });
    }
    getActiveObjectTip(objectId) {
        const obj = this.core.store.objects?.findById(objectId);
        if (!obj)
            return null;
        if (obj instanceof KritzelPath && !obj.isCompleted) {
            const lastPoint = obj.points[obj.points.length - 1];
            if (!lastPoint)
                return null;
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
    worldToScreen(worldX, worldY) {
        const { scale, translateX, translateY } = this.core.store.state;
        return {
            x: worldX * scale + translateX,
            y: worldY * scale + translateY,
        };
    }
    isInViewport(screenX, screenY) {
        const { viewportWidth, viewportHeight } = this.core.store.state;
        return screenX >= 0 && screenX <= viewportWidth && screenY >= 0 && screenY <= viewportHeight;
    }
    clampToEdge(screenX, screenY) {
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
        if (minDist === distLeft)
            edge = 'left';
        else if (minDist === distRight)
            edge = 'right';
        else if (minDist === distTop)
            edge = 'top';
        else
            edge = 'bottom';
        const angle = Math.atan2(screenY - clampedY, screenX - clampedX);
        return { x: clampedX, y: clampedY, angle, edge };
    }
    getUserDisplayName(user) {
        if (user.displayName)
            return user.displayName;
        if (user.firstName || user.lastName) {
            return [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
        return 'Unknown';
    }
    getInitials(name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0 || (parts.length === 1 && parts[0].length <= 1)) {
            return name;
        }
        if (parts.length === 1) {
            return parts[0][0].toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        return (h(Host, { key: '2021875ea3e430c04da438dc5b7a2c22f119ea67' }, cursors.map(remoteCursor => {
            if (!remoteCursor.cursor)
                return null;
            // When a remote user is actively drawing, derive cursor position from
            // the object's latest coordinates (synced via Yjs) instead of the
            // throttled awareness cursor position
            let screen;
            let trackingObject = false;
            if (remoteCursor.activeObjectId) {
                const tip = this.getActiveObjectTip(remoteCursor.activeObjectId);
                if (tip) {
                    trackingObject = true;
                    screen = this.worldToScreen(tip.x, tip.y);
                }
                else {
                    screen = this.worldToScreen(remoteCursor.cursor.x, remoteCursor.cursor.y);
                }
            }
            else {
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
        }), cursors.map(remoteCursor => {
            if (!remoteCursor.selectionBox)
                return null;
            const color = remoteCursor.user.color || '#6B7280';
            const box = remoteCursor.selectionBox;
            const topLeft = this.worldToScreen(box.x, box.y);
            const { scale } = this.core.store.state;
            const screenWidth = box.width * scale;
            const screenHeight = box.height * scale;
            return (h("div", { key: `selection-box-${remoteCursor.clientId}`, class: "remote-selection-box", style: {
                    transform: `translate(${topLeft.x}px, ${topLeft.y}px)`,
                    width: `${screenWidth}px`,
                    height: `${screenHeight}px`,
                    backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                    borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
                } }));
        })));
    }
    renderCursor(cursor, screenX, screenY, color, stale, trackingObject) {
        return (h("div", { key: `cursor-${cursor.clientId}`, class: { 'awareness-cursor': true, stale, 'tracking-object': trackingObject }, style: { transform: `translate(${screenX}px, ${screenY}px)` } }, h("svg", { class: "cursor-arrow", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, h("path", { d: "M5 3L19 12L12 13L9 20L5 3Z", fill: color, stroke: "#ffffff", "stroke-width": "1.5", "stroke-linejoin": "round" })), h("span", { class: "cursor-label", style: { backgroundColor: color } }, this.getUserDisplayName(cursor.user))));
    }
    renderEdgeIndicator(cursor, screenX, screenY, color, stale, trackingObject) {
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
        }
        else if (clamped.edge === 'right') {
            labelX = -labelOffset;
        }
        else if (clamped.edge === 'top') {
            labelY = labelOffset;
        }
        else if (clamped.edge === 'bottom') {
            labelY = -labelOffset;
        }
        const displayName = this.getUserDisplayName(cursor.user);
        return (h("div", { key: `edge-${cursor.clientId}`, class: { 'edge-indicator': true, stale, 'tracking-object': trackingObject }, style: {
                transform: `translate(${clamped.x}px, ${clamped.y}px)`,
            } }, h("svg", { class: { 'edge-arrow': true, stale }, width: "16", height: "16", viewBox: "0 0 16 16", style: { transform: `rotate(${arrowDeg}deg)` } }, h("path", { d: "M8 1L14 13H2L8 1Z", fill: color, stroke: "#ffffff", "stroke-width": "1.5", "stroke-linejoin": "round" })), h("span", { class: "edge-label", style: {
                backgroundColor: color,
                transform: `translate(${labelX}px, ${labelY}px)`,
            } }, this.getInitials(displayName))));
    }
};
KritzelAwarenessCursors.style = kritzelAwarenessCursorsCss();

export { KritzelAwarenessCursors as kritzel_awareness_cursors };
//# sourceMappingURL=kritzel-awareness-cursors.entry.esm.js.map

//# sourceMappingURL=kritzel-awareness-cursors.entry.js.map