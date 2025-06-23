import { Component, Host, Listen, State, h } from '@stencil/core';

@Component({
  tag: 'kritzel-cursor-trail',
  styleUrl: 'kritzel-cursor-trail.css',
  shadow: true,
})
export class KritzelCursorTrail {
  @State()
  cursorTrailPoints: Array<{ x: number; y: number; timestamp: number }> = [];

  @State()
  isLeftButtonDown: boolean = false;

  private trailCleanupIntervalId: number;

  private readonly TRAIL_DURATION_MS = 100;

  private readonly MAX_TRAIL_POINTS = 50;

  componentDidLoad() {
    this.trailCleanupIntervalId = window.setInterval(() => {
      const now = Date.now();
      const newTrailPoints = this.cursorTrailPoints.filter(p => now - p.timestamp < this.TRAIL_DURATION_MS);
      if (newTrailPoints.length !== this.cursorTrailPoints.length) {
        this.cursorTrailPoints = newTrailPoints;
      }
    }, 50);
  }

  disconnectedCallback() {
    if (this.trailCleanupIntervalId) {
      window.clearInterval(this.trailCleanupIntervalId);
    }
  }

  @Listen('mousedown', { target: 'window' })
  handleMouseDown(ev: MouseEvent) {
    if (ev.button === 0) {
      this.isLeftButtonDown = true;
      this.cursorTrailPoints = [];
    }
  }

  @Listen('mousemove', { target: 'window', passive: true })
  handleMouseMove(ev: MouseEvent) {

    if (!this.isLeftButtonDown) {
      return;
    }
    const newPoint = { x: ev.clientX, y: ev.clientY, timestamp: Date.now() };
    const updatedTrail = [newPoint, ...this.cursorTrailPoints];
    if (updatedTrail.length > this.MAX_TRAIL_POINTS) {
      this.cursorTrailPoints = updatedTrail.slice(0, this.MAX_TRAIL_POINTS);
    } else {
      this.cursorTrailPoints = updatedTrail;
    }
  }

  @Listen('mouseup', { target: 'window' })
  handleMouseUp(ev: MouseEvent) {
    if (ev.button === 0) {
      this.isLeftButtonDown = false;
      this.cursorTrailPoints = [];
    }
  }

  @Listen('touchstart', { target: 'window' })
  handleTouchStart(ev: TouchEvent) {
    if (ev.touches.length === 1) {
      this.isLeftButtonDown = true;
      this.cursorTrailPoints = [];
    }
  }

  @Listen('touchmove', { target: 'window', passive: true })
  handleTouchMove(ev: TouchEvent) {
    if (!this.isLeftButtonDown) {
      return;
    }

    const touch = ev.touches[0];
    const newPoint = { x: touch.clientX, y: touch.clientY, timestamp: Date.now() };
    const updatedTrail = [newPoint, ...this.cursorTrailPoints];
    if (updatedTrail.length > this.MAX_TRAIL_POINTS) {
      this.cursorTrailPoints = updatedTrail.slice(0, this.MAX_TRAIL_POINTS);
    }
    else {
      this.cursorTrailPoints = updatedTrail;
    }
  }

  @Listen('touchend', { target: 'window' })
  handleTouchEnd(ev: TouchEvent) {
    if (ev.touches.length === 0) {
      this.isLeftButtonDown = false;
      this.cursorTrailPoints = [];
    }
  }
  

  render() {
    return (
      <Host>
        {this.cursorTrailPoints.length > 1 && (
          <svg
            class="cursor-trail-svg"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              left: '0',
              top: '0',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              opacity: 'var(--kritzel-cursor-trail-opacity, 0.6)',
              zIndex: '9000',
            }}
          >
            {this.cursorTrailPoints.slice(1).map((point, index) => {
              const prevPoint = this.cursorTrailPoints[index];
              const now = Date.now();
              const age = now - point.timestamp;
              const progress = Math.max(0, Math.min(1, age / this.TRAIL_DURATION_MS));

              if (progress >= 1) return null;

              const baseStrokeWidth = Math.max(2, 15 * (1 - progress));

              return (
                <line
                  key={`trail-segment-${point.timestamp}`}
                  x1={prevPoint.x.toString()}
                  y1={prevPoint.y.toString()}
                  x2={point.x.toString()}
                  y2={point.y.toString()}
                  stroke="var(--kritzel-cursor-trail-color, rgb(228, 228, 228))"
                  stroke-width={baseStrokeWidth.toString()}
                  stroke-linecap="round"
                />
              );
            })}
          </svg>
        )}
      </Host>
    );
  }
}
