import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, signal, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { 
  KritzelEditor, 
  KritzelViewportState, 
  KritzelSyncConfig, 
  KritzelShape, 
  KritzelImage, 
  ShapeType, 
  IndexedDBSyncProvider,
  InMemorySyncProvider
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

interface Defect {
  id: string;
  title: string;
  category: string;
  x: number;
  y: number;
  status: 'Outstanding' | 'In Progress' | 'Resolved';
  pinId: string;
}

@Component({
  selector: 'app-blueprint-defect-mapper',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mapper-workspace">
      <div class="editor-pane">
        <kritzel-editor
          editorId="blueprint-defect-mapper"
          #editorEl
          [themes]="themes"
          [theme]="'angular-theme'"
          [syncConfig]="syncConfig"
          [loginConfig]="undefined"
          [isMoreMenuVisible]="false"
          [isWorkspaceManagerVisible]="false"
          (isReady)="onReady()"
          (viewportChange)="onViewportChange($event)"
          (click)="onCanvasClick($event)"
        ></kritzel-editor>
        
        @if (placingMode()) {
          <div class="placing-toast">
            📍 Click anywhere on the blueprint to place a defect pin
          </div>
        }
      </div>

      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="badge">Facilities</span>
          <h2 class="sidebar-title">Blueprint Defect Mapper</h2>
          <p class="sidebar-desc">Report and monitor structural defects directly onto floor plan blueprints.</p>
        </div>

        <div class="map-controls">
          <button 
            class="action-btn" 
            [class.active]="placingMode()" 
            (click)="togglePlacingMode()"
          >
            @if (placingMode()) {
              🔴 Cancel Pin Placement
            } @else {
              📍 Place New Defect Pin
            }
          </button>
          <button class="reset-btn" (click)="resetView()">Reset Zoom</button>
        </div>

        <!-- Coordinates Status Hub -->
        <div class="coord-inspector">
          <div class="section-sub">Coordinate Monitor</div>
          <div class="coord-readout">
            <div>
              World Pan: 
              <span class="mon-val">
                X: {{ (viewport()?.translateX ?? 0) | number:'1.0-0' }} 
                Y: {{ (viewport()?.translateY ?? 0) | number:'1.0-0' }}
              </span>
            </div>
            <div>
              Zoom Level: 
              <span class="mon-val">
                {{ ((viewport()?.scale ?? 1) * 100) | number:'1.0-0' }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Site Defects Board -->
        <div class="defects-section">
          <div class="section-title-row">
            <h3>Reported Defects ({{ defects().length }})</h3>
          </div>
          
          <div class="defects-list">
            @if (defects().length === 0) {
              <div class="empty-list">No defects reported. Click "Place New Defect Pin" to report site defects.</div>
            } @else {
              @for (d of defects(); track d.id) {
                <div class="defect-card" (click)="zoomToDefect(d)">
                  <div class="defect-header">
                    <span class="status-indicator" [class]="d.status.toLowerCase().replace(' ', '-')"></span>
                    <span class="defect-title">{{ d.title }}</span>
                    <span class="defect-cat">{{ d.category }}</span>
                  </div>
                  <div class="defect-body">
                    Units: x: {{ d.x }}, y: {{ d.y }}
                  </div>
                  <div class="defect-footer">
                    <select (click)="$event.stopPropagation()" (change)="changeDefectStatus(d, $any($event.target).value)" class="status-select">
                      <option [selected]="d.status === 'Outstanding'" value="Outstanding">Outstanding</option>
                      <option [selected]="d.status === 'In Progress'" value="In Progress">In Progress</option>
                      <option [selected]="d.status === 'Resolved'" value="Resolved">Resolved</option>
                    </select>
                    <button class="delete-btn" (click)="deleteDefect(d, $event)">Delete</button>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      font-family: Roboto, sans-serif;
      background: #fafafa;
    }

    .mapper-workspace {
      display: flex;
      height: 100%;
      width: 100%;
    }

    .editor-pane {
      flex: 1;
      position: relative;
      height: 100%;
    }

    kritzel-editor {
      display: block;
      width: 100%;
      height: 100%;
    }

    .placing-toast {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(221, 0, 49, 0.95);
      color: white;
      padding: 8px 20px;
      border-radius: 99px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      z-index: 10;
      animation: pulse 1.8s infinite;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    @keyframes pulse {
      0%, 100% { transform: translateX(-50%) scale(1); }
      50% { transform: translateX(-50%) scale(1.03); opacity: 0.9; }
    }

    .sidebar {
      width: 320px;
      border-left: 1px solid #ebebeb;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-shadow: -1px 0 3px rgba(0, 0, 0, 0.02);
    }

    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #ebebeb;
    }

    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background-color: rgba(221, 0, 48, 0.1);
      color: #dd0031;
      padding: 2px 8px;
      border-radius: 99px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .sidebar-title {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333333;
    }

    .sidebar-desc {
      margin: 0;
      font-size: 12px;
      color: #666666;
      line-height: 1.4;
    }

    .map-controls {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: #fcfcfc;
      border-bottom: 1px solid #ebebeb;
    }

    .action-btn {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #dd0031;
      border-radius: 6px;
      background: #ffffff;
      color: #dd0031;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .action-btn:hover {
      background: #dd0031;
      color: #ffffff;
    }

    .action-btn.active {
      background: #dd0031;
      color: #ffffff;
    }

    .reset-btn {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      background: #ffffff;
      color: #333333;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .reset-btn:hover {
      background: #f0f0f0;
    }

    .coord-inspector {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #ebebeb;
      font-size: 12px;
      color: #475569;
    }

    .section-sub {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }

    .coord-readout {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mon-val {
      font-family: monospace;
      font-weight: 600;
      color: #334155;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
    }

    .defects-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .section-title-row {
      padding: 12px 16px 8px 16px;
    }

    .section-title-row h3 {
      margin: 0;
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }

    .defects-list {
      flex: 1;
      overflow-y: auto;
      padding: 0 16px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-list {
      padding: 32px 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      border: 1px dashed #e2e8f0;
      border-radius: 8px;
    }

    .defect-card {
      border: 1px solid #ebebeb;
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: #ffffff;
    }

    .defect-card:hover {
      border-color: #dd0031;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .defect-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.outstanding {
      background-color: #dd0031;
    }

    .status-indicator.in-progress {
      background-color: #f59e0b;
    }

    .status-indicator.resolved {
      background-color: #10b981;
    }

    .defect-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .defect-cat {
      font-size: 10px;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 99px;
      font-weight: 500;
    }

    .defect-body {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 8px;
      font-family: monospace;
    }

    .defect-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }

    .status-select {
      font-size: 11px;
      padding: 3px 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      color: #333;
    }

    .delete-btn {
      font-size: 11px;
      color: #64748b;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 2px 4px;
    }

    .delete-btn:hover {
      color: #dd0031;
    }
  `,
})
export class BlueprintDefectMapperComponent implements OnDestroy {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  viewport = signal<KritzelViewportState | null>(null);
  placingMode = signal<boolean>(false);
  defects = signal<Defect[]>([]);
  
  private nextDefectId = 2; // seeded defects account for 1, 2
  private lockInterval: any;
  private hasInitialCenteringRun = false;

  async onReady() {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.initializeBlueprint();
    } else {
      await this.restoreDefectsFromCanvas();
    }

    // Set initial custom viewport focus directly on the floorplan origin (0, 0)
    await this.editor.setViewport(0, 0, 0.75);

    // Ensure our background blueprint elements are set to pointer-events: none is repeated 
    // to prevent selection / grabbing of floorplan components.
    this.lockScenery();
    this.lockInterval = setInterval(() => this.lockScenery(), 500);
  }

  async initializeBlueprint() {
    // 1. Load Blueprint floorplan.png from local assets as unselectable background scenery
    const bg = await KritzelImage.fromUrl('assets/floorplan.png', {
      maxWidth: 1200,
      maxHeight: 900,
      translateX: -600,
      translateY: -450,
    });
    bg.id = 'blueprint-bg';
    bg.isEditable = false;
    await this.editor.addObject(bg);

    // 2. Seed initial reported defects onto floor plans
    const seedPins = [
      { id: 'defect-1', title: 'Wall Stress Fracture', category: 'Structural', x: -300, y: -200, status: 'Outstanding' as const },
      { id: 'defect-2', title: 'HVAC Condensation Leak', category: 'HVAC', x: 300, y: -200, status: 'In Progress' as const },
    ];

    const initialList: Defect[] = [];

    for (const d of seedPins) {
      const pinId = `pin-${d.id}`;
      const pin = new KritzelShape({
        translateX: d.x - 15,
        translateY: d.y - 15,
        width: 30,
        height: 30,
        shapeType: ShapeType.Ellipse,
        fillColor: this.getPinColor(d.status),
        strokeColor: { light: '#ffffff', dark: '#ffffff' },
        strokeWidth: 2,
      });
      pin.id = pinId;
      pin.isEditable = false;
      await this.editor.addObject(pin);

      initialList.push({
        id: d.id,
        title: d.title,
        category: d.category,
        x: d.x,
        y: d.y,
        status: d.status,
        pinId: pinId,
      });
    }

    this.defects.set(initialList);
  }

  async restoreDefectsFromCanvas() {
    const all = await this.editor.getAllObjects();
    const pinObjects = all.filter(o => o.id.startsWith('pin-') && o instanceof KritzelShape) as KritzelShape[];
    
    const restoredList: Defect[] = [];
    pinObjects.forEach(pin => {
      const parts = pin.id.split('-');
      const id = parts.slice(1).join('-');
      
      let status: 'Outstanding' | 'In Progress' | 'Resolved' = 'Outstanding';
      const fillLight = (pin.fillColor as any)?.light;
      if (fillLight === '#f59e0b') {
        status = 'In Progress';
      } else if (fillLight === '#10b981') {
        status = 'Resolved';
      }

      let title = 'Defect';
      let category = 'Facility';
      if (id === 'defect-1') { title = 'Wall Stress Fracture'; category = 'Structural'; }
      else if (id === 'defect-2') { title = 'HVAC Condensation Leak'; category = 'HVAC'; }
      else if (id === 'defect-3') { title = 'Exposed Electrical Terminal'; category = 'Electrical'; }
      else {
        title = `Pinned Defect ${id}`;
        category = 'Manual';
      }

      restoredList.push({
        id: id || pin.id,
        title,
        category,
        x: Math.round(pin.translateX + 15),
        y: Math.round(pin.translateY + 15),
        status,
        pinId: pin.id
      });
    });

    this.defects.set(restoredList);
  }

  getPinColor(status: 'Outstanding' | 'In Progress' | 'Resolved') {
    if (status === 'Outstanding') return { light: '#dd0031', dark: '#ef4444' };
    if (status === 'In Progress') return { light: '#f59e0b', dark: '#f59e0b' };
    return { light: '#10b981', dark: '#10b981' };
  }

  togglePlacingMode() {
    const newMode = !this.placingMode();
    this.placingMode.set(newMode);
    if (newMode) {
      // Force change editor selection tool to prevent drawing marks while dropping pin
      this.editor.changeActiveToolByName('select');
    }
  }

  async onCanvasClick(event: MouseEvent) {
    if (!this.placingMode()) {
      return;
    }

    const rect = this.editorEl.nativeElement.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Convert screen pointer location relative to container into real-world blueprint units
    const worldPos = await this.editor.screenToWorld(screenX, screenY);
    
    // Add customized defect circular marker
    const defectId = `defect-user-${++this.nextDefectId}`;
    const pinId = `pin-${defectId}`;
    
    const pin = new KritzelShape({
      translateX: worldPos.x - 15,
      translateY: worldPos.y - 15,
      width: 30,
      height: 30,
      shapeType: ShapeType.Ellipse,
      fillColor: this.getPinColor('Outstanding'),
      strokeColor: { light: '#ffffff', dark: '#ffffff' },
      strokeWidth: 2,
    });
    pin.id = pinId;
    pin.isEditable = false;

    await this.editor.addObject(pin);

    const newDefect: Defect = {
      id: defectId,
      title: `Defect #${this.nextDefectId}`,
      category: 'Manual Pin',
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
      status: 'Outstanding',
      pinId: pinId,
    };

    this.defects.update(list => [...list, newDefect]);
    
    // Deactivate placement mode after success
    this.placingMode.set(false);
    this.lockScenery();
  }

  async zoomToDefect(defect: Defect) {
    // Zoom and pan the viewport camera to center on the defect pin's absolute world coordinates without moving the pin itself
    await this.editor.setViewport(defect.x, defect.y, 1.25);
  }

  async resetView() {
    await this.editor.setViewport(0, 0, 0.75);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
    this.lockScenery();

    // Perform target camera centering once the editor element has non-zero layout dimensions
    if (!this.hasInitialCenteringRun && event.detail.width > 0 && event.detail.height > 0) {
      this.hasInitialCenteringRun = true;
      setTimeout(async () => {
        await this.editor.setViewport(0, 0, 0.75);
      }, 50);
    }
  }

  lockScenery() {
    const shadow = this.editorEl?.nativeElement?.shadowRoot;
    if (!shadow) return;

    const sceneryIds = [
      'blueprint-bg'
    ];

    for (const id of sceneryIds) {
      const el = shadow.getElementById(id);
      if (el) {
        el.style.pointerEvents = 'none';
      }
    }
  }

  async changeDefectStatus(defect: Defect, newStatus: 'Outstanding' | 'In Progress' | 'Resolved') {
    this.defects.update(list => list.map(d => d.id === defect.id ? { ...d, status: newStatus } : d));
    
    const pin = await this.editor.getObjectById(defect.pinId) as KritzelShape;
    if (pin) {
      await this.editor.updateObject(pin, { fillColor: this.getPinColor(newStatus) });
    }
  }

  async deleteDefect(defect: Defect, event: MouseEvent) {
    event.stopPropagation();
    
    const pin = await this.editor.getObjectById(defect.pinId);
    if (pin) {
      await this.editor.removeObject(pin);
    }
    
    this.defects.update(list => list.filter(d => d.id !== defect.id));
  }

  ngOnDestroy() {
    if (this.lockInterval) {
      clearInterval(this.lockInterval);
    }
  }
}