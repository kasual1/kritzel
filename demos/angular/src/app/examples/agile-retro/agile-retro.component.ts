import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, signal, OnDestroy } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import {
  KritzelEditor,
  KritzelViewportState,
  KritzelSyncConfig,
  KritzelShape,
  KritzelText,
  KritzelLine,
  KritzelBaseObject,
  ShapeType,
  ContextMenuItem,
  InMemorySyncProvider,
  EditorIsReadyEvent,
  ObjectsAddedEvent,
  ObjectsRemovedEvent,
  ObjectsUpdatedEvent,
  KritzelAlignment
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';

interface StickyCardItem {
  id: string;
  textId?: string;
  text: string;
  color: 'yellow' | 'green' | 'pink' | 'blue';
  x: number;
  y: number;
  shape: KritzelShape;
  textObj?: KritzelText;
}

@Component({
  selector: 'app-agile-retro',
  imports: [KritzelEditor, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="retro-workspace">
      <!-- Main Canvas Pane -->
      <div class="editor-pane">
        <kritzel-editor
          editorId="agile-retro"
          #editorEl
          [themes]="themes"
          [theme]="'angular-theme'"
          [syncConfig]="syncConfig"
          [globalContextMenuItems]="globalItems"
          [objectContextMenuItems]="objectItems"
          [loginConfig]="undefined"
          [isMoreMenuVisible]="false"
          [isWorkspaceManagerVisible]="false"
          (isReady)="onReady($event)"
          (objectsAdded)="onObjectsAdded($event)"
          (objectsRemoved)="onObjectsRemoved($event)"
          (objectsUpdated)="onObjectsUpdated($event)"
          (viewportChange)="onViewportChange($event)"
        ></kritzel-editor>
        
        <div class="hud-helper">
          💡 Right-click empty canvas to add stickies. Right-click cards to cluster, align, group, or change colors.
        </div>
      </div>

      <!-- Retro & Kanban Control Center Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="badge">Retrospective</span>
          <h2 class="sidebar-title">Board Control</h2>
          <p class="sidebar-desc">Visually catalog retrospectives, coordinate task relations, and align workspace layers.</p>
        </div>

        <!-- Tool Selection Hub -->
        <div class="section-container">
          <div class="section-sub">Active Annotation Tool</div>
          <div class="tool-grid">
            <button class="tool-btn" [class.active]="activeTool() === 'select'" (click)="activateTool('select')">
              🫵 Select & Grab
            </button>
            <button class="tool-btn" [class.active]="activeTool() === 'line'" (click)="activateTool('line')">
              ➡️ Connector Line
            </button>
            <button class="tool-btn" [class.active]="activeTool() === 'brush'" (click)="activateTool('brush')">
              ✏️ Pen Drawing
            </button>
            <button class="tool-btn" [class.active]="activeTool() === 'eraser'" (click)="activateTool('eraser')">
              🧽 Eraser
            </button>
          </div>
        </div>

        <!-- Sticky Spawner -->
        <div class="section-container">
          <div class="section-sub">Spawn New Sticky Card</div>
          <div class="spawner-buttons">
            <button class="spawn-btn green" (click)="spawnSticky('green')">+ Green Card</button>
            <button class="spawn-btn pink" (click)="spawnSticky('pink')">+ Pink Card</button>
            <button class="spawn-btn blue" (click)="spawnSticky('blue')">+ Blue Card</button>
            <button class="spawn-btn yellow" (click)="spawnSticky('yellow')">+ Yellow Card</button>
          </div>
        </div>

        <!-- Board Metrics -->
        <div class="metrics-hub">
          <div class="section-sub">Workspace Stats</div>
          <div class="stats-row">
            <div class="stat-box">
              <span class="stat-lbl">Stickies</span>
              <span class="stat-val">{{ cards().length }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-lbl">Zoom</span>
              <span class="stat-val">{{ zoomPercentage() }}%</span>
            </div>
          </div>
        </div>

        <!-- Interactive Board List -->
        <div class="cards-section">
          <div class="section-sub">Sticky Cards Explorer ({{ cards().length }})</div>
          <div class="cards-list">
            @if (cards().length === 0) {
              <div class="empty-list">
                No active sticky cards detected. Spawn cards above or right-click onto the empty canvas.
              </div>
            } @else {
              @for (c of cards(); track c.id) {
                <div class="card-item" [class]="c.color" (click)="zoomToCard(c)">
                  <div class="card-item-header">
                    <span class="card-dot" [class]="c.color"></span>
                    <span class="card-color-lbl">{{ c.color | uppercase }} NOTE</span>
                    <button class="card-del-btn" (click)="deleteSelectedCard(c, $event)" title="Delete Card">✕</button>
                  </div>
                  <div class="card-text">{{ c.text }}</div>
                  <div class="card-coords">Pos: ({{ c.x }}, {{ c.y }})</div>
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

    .retro-workspace {
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

    .hud-helper {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(30, 41, 59, 1);
      color: #f8fafc;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 11px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 5;
      pointer-events: none;
      border: 1px solid #334155;
      max-width: 480px;
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
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }

    .section-container {
      padding: 12px 16px;
      border-bottom: 1px solid #ebebeb;
      background: #fbfbfc;
    }

    .section-sub {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .tool-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .tool-btn {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }

    .tool-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .tool-btn.active {
      background: #dd0031;
      color: #ffffff;
      border-color: #dd0031;
    }

    .spawner-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .spawn-btn {
      padding: 6px;
      border-radius: 4px;
      border: 1px solid transparent;
      font-weight: 600;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .spawn-btn.green {
      background: #dcfce7;
      color: #166534;
      border-color: #bbf7d0;
    }
    .spawn-btn.green:hover { background: #bbf7d0; }

    .spawn-btn.pink {
      background: #fce7f3;
      color: #9d174d;
      border-color: #fbcfe8;
    }
    .spawn-btn.pink:hover { background: #fbcfe8; }

    .spawn-btn.blue {
      background: #dbeafe;
      color: #1e40af;
      border-color: #bfdbfe;
    }
    .spawn-btn.blue:hover { background: #bfdbfe; }

    .spawn-btn.yellow {
      background: #fef9c3;
      color: #854d0e;
      border-color: #fef08a;
    }
    .spawn-btn.yellow:hover { background: #fef08a; }

    .metrics-hub {
      padding: 10px 16px;
      border-bottom: 1px solid #ebebeb;
      background: #fafafc;
    }

    .stats-row {
      display: flex;
      gap: 8px;
    }

    .stat-box {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
    }

    .stat-lbl {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
    }

    .stat-val {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
    }

    .cards-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 12px 16px;
    }

    .cards-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .empty-list {
      padding: 24px 12px;
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
      border: 1px dashed #e2e8f0;
      border-radius: 6px;
      line-height: 1.4;
    }

    .card-item {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: #ffffff;
    }

    .card-item:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      transform: translateY(-1px);
    }

    .card-item.green { border-color: #4ade80; background: #fafdfb; }
    .card-item.green:hover { border-color: #166534; }

    .card-item.pink { border-color: #f472b6; background: #fdfafb; }
    .card-item.pink:hover { border-color: #9d174d; }

    .card-item.blue { border-color: #60a5fa; background: #fafbfe; }
    .card-item.blue:hover { border-color: #1e40af; }

    .card-item.yellow { border-color: #facc15; background: #fefefe; }
    .card-item.yellow:hover { border-color: #854d0e; }

    .card-item-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    .card-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .card-dot.green { background: #166534; }
    .card-dot.pink { background: #9d174d; }
    .card-dot.blue { background: #1e40af; }
    .card-dot.yellow { background: #854d0e; }

    .card-color-lbl {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      flex: 1;
    }

    .card-del-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 10px;
      padding: 1px 3px;
      border-radius: 3px;
    }

    .card-del-btn:hover {
      color: #dd0031;
      background: #f1f5f9;
    }

    .card-text {
      font-size: 11px;
      line-height: 1.4;
      color: #1e293b;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-coords {
      font-size: 8px;
      font-family: monospace;
      color: #94a3b8;
      margin-top: 4px;
      text-align: right;
    }
  `,
})
export class AgileRetroComponent implements OnDestroy {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  viewport = signal<KritzelViewportState | null>(null);
  activeTool = signal<string>('select');
  cards = signal<StickyCardItem[]>([]);
  nextStickyId = 200;

  zoomPercentage() {
    return Math.round((this.viewport()?.scale ?? 1.0) * 100);
  }

  onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    this.refreshAndSeed();
  }

  async refreshAndSeed() {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.initializeBoard();
    } else {
      await this.syncCards();
    }

    // Set custom initial retrospective coordinates viewport focus
    await this.editor.setViewport(0, 0, 1.0);
  }

  async initializeBoard() {
    // 1. Create retrospective board columns (Sections) as static background shapes
    const colY = -250;
    const colHeight = 550;
    const colWidth = 240;

    const cols = [
      { id: 'col-well', title: 'WHAT WENT WELL', color: '#10b981', x: -410 },
      { id: 'col-improve', title: 'WHAT TO IMPROVE', color: '#ec4899', x: -120 },
      { id: 'col-actions', title: 'ACTION ITEMS', color: '#3b82f6', x: 170 },
    ];

    for (const c of cols) {
      // Draw background panel
      const bgCol = new KritzelShape({
        translateX: c.x,
        translateY: colY + 40,
        width: colWidth,
        height: colHeight,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#f8fafc', dark: '#151c2c' },
        strokeColor: { light: '#e2e8f0', dark: '#334155' },
        strokeWidth: 2,
      });
      bgCol.id = c.id;
      bgCol.isEditable = false;
      await this.editor.addObject(bgCol);

      // Draw Header Text
      const headerText = new KritzelText({
        text: c.title,
        translateX: c.x + 15,
        translateY: colY,
        fontSize: 14,
      });
      headerText.id = `header-${c.id}`;
      headerText.isEditable = false;
      await this.editor.addObject(headerText);
    }

    // 2. Preseed standard retrospective colored sticky cards
    // WHAT WENT WELL (Green notes)
    await this.addStickyCard(
      'Automated mock suites reduced regression test execution by over 50%.',
      'green',
      -380,
      -170
    );
    await this.addStickyCard(
      'Fabulous team alignment and synergy observed during remote retrospective.',
      'green',
      -380,
      0
    );

    // WHAT TO IMPROVE (Pink notes)
    await this.addStickyCard(
      'Cross-team dependencies heavily blocked front-end delivery for 4 days.',
      'pink',
      -90,
      -170
    );
    await this.addStickyCard(
      'Our daily coordination meetings frequently overlap allocated 15 minutes limit.',
      'pink',
      -90,
      0
    );

    // ACTION ITEMS (Blue notes)
    await this.addStickyCard(
      'Formulate solid api integration contracts 1 week prior to implementation.',
      'blue',
      200,
      -170
    );
    await this.addStickyCard(
      'Appoint retro facilitator to proactively enforce timing limits.',
      'blue',
      200,
      0
    );

    // 3. Draw visual vector arrow describing task relation across columns!
    const connector = new KritzelLine({
      startX: 120,
      startY: -105,
      endX: 200,
      endY: -105,
      stroke: { light: '#64748b', dark: '#94a3b8' },
      strokeWidth: 2.5,
      arrows: {
        end: { enabled: true, style: 'triangle' },
      },
    });
    connector.id = 'connector-1';
    await this.editor.addObject(connector);

    await this.syncCards();
  }

  async addStickyCard(text: string, color: 'yellow' | 'green' | 'pink' | 'blue', x: number, y: number) {
    const colorMap = {
      yellow: { fill: { light: '#fef08a', dark: '#151505' }, stroke: { light: '#eab308', dark: '#facc15' } },
      green: { fill: { light: '#bbf7d0', dark: '#021e08' }, stroke: { light: '#22c55e', dark: '#4ade80' } },
      pink: { fill: { light: '#fbcfe8', dark: '#240212' }, stroke: { light: '#ec4899', dark: '#f472b6' } },
      blue: { fill: { light: '#bfdbfe', dark: '#020f2b' }, stroke: { light: '#3b82f6', dark: '#60a5fa' } },
    };
    const colors = colorMap[color];
    const idSuffix = ++this.nextStickyId;
    const shapeId = `sticky-${idSuffix}`;
    const textId = `text-sticky-${idSuffix}`;

    const shape = new KritzelShape({
      translateX: x,
      translateY: y,
      width: 180,
      height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: colors.fill,
      strokeColor: colors.stroke,
      strokeWidth: 2,
    });
    shape.id = shapeId;

    const textObj = new KritzelText({
      text: text,
      translateX: x + 12,
      translateY: y + 20,
      fontSize: 12,
      fontColor: {
        light: '#1e293b',
        dark: '#e2e8f0',
      },
    });
    textObj.id = textId;

    await this.editor.addObject(shape);
    await this.editor.addObject(textObj);

    // Group the shape and text together programmatically
    await this.editor.selectObjects([shape, textObj]);
    await this.editor.group();
    await this.editor.selectObjects([]);
  }

  async syncCards() {
    if (!this.editor) return;
    const all = await this.editor.getAllObjects();

    // Catalog shapes starting with 'sticky-'
    const stickies = all.filter(o => o.id.startsWith('sticky-') && o instanceof KritzelShape) as KritzelShape[];

    const list: StickyCardItem[] = stickies.map(shape => {
      const parts = shape.id.split('-');
      const textId = `text-sticky-${parts[1]}`;
      const textObj = all.find(o => o.id === textId) as KritzelText | undefined;

      // Color mapping
      let color: 'yellow' | 'green' | 'pink' | 'blue' = 'yellow';
      const fillLight = (shape.fillColor as any)?.light || (shape.fillColor as any);
      if (fillLight === '#bbf7d0') color = 'green';
      else if (fillLight === '#fbcfe8') color = 'pink';
      else if (fillLight === '#bfdbfe') color = 'blue';

      return {
        id: shape.id,
        textId,
        text: 'New Card Description',
        color,
        x: Math.round(shape.translateX),
        y: Math.round(shape.translateY),
        shape,
        textObj,
      };
    });

    this.cards.set(list);
  }

  async spawnSticky(color: 'yellow' | 'green' | 'pink' | 'blue') {
    let text = 'Retro Item: ';
    let rx = -50;
    let ry = -50;

    if (color === 'green') { text = 'What went well: '; rx = -380; ry = 150; }
    else if (color === 'pink') { text = 'Improvement: '; rx = -90; ry = 150; }
    else if (color === 'blue') { text = 'Action card: '; rx = 200; ry = 150; }

    await this.addStickyCard(text, color, rx, ry);
  }

  async zoomToCard(card: StickyCardItem) {
    if (!this.editor) return;
    // panTo centers view on card
    await this.editor.panTo(card.x + 90, card.y + 60);
    // highlight card shape
    await this.editor.selectObjects([card.shape]);
  }

  async deleteSelectedCard(card: StickyCardItem, event: MouseEvent) {
    event.stopPropagation();
    if (!this.editor) return;

    // Delete elements from the drawing engine
    if (card.textObj) await this.editor.removeObject(card.textObj);
    await this.editor.removeObject(card.shape);

    await this.syncCards();
  }

  async updateStickyColor(shapeId: string, color: 'yellow' | 'green' | 'pink' | 'blue') {
    const colorMap = {
      yellow: { fill: { light: '#fef08a', dark: '#151505' }, stroke: { light: '#eab308', dark: '#facc15' } },
      green: { fill: { light: '#bbf7d0', dark: '#021e08' }, stroke: { light: '#22c55e', dark: '#4ade80' } },
      pink: { fill: { light: '#fbcfe8', dark: '#240212' }, stroke: { light: '#ec4899', dark: '#f472b6' } },
      blue: { fill: { light: '#bfdbfe', dark: '#020f2b' }, stroke: { light: '#3b82f6', dark: '#60a5fa' } },
    };
    const colors = colorMap[color];
    const all = await this.editor.getAllObjects();
    const shape = all.find(o => o.id === shapeId) as KritzelShape | undefined;
    if (shape) {
      await this.editor.updateObject(shape, {
        fillColor: colors.fill,
        strokeColor: colors.stroke,
      });
    }
  }

  async activateTool(toolName: string) {
    if (!this.editor) return;
    await this.editor.changeActiveToolByName(toolName);
    this.activeTool.set(toolName);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }

  onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    this.syncCards();
  }

  onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    this.syncCards();
  }

  onObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
    this.syncCards();
  }

  ngOnDestroy() {}

  // Context Menu Overrides
  globalItems: ContextMenuItem[] = [
    {
      label: 'Add Sticky Note',
      group: 'add',
      children: [
        {
          label: 'Green (What Went Well)',
          action: (menu) => this.addStickyCard('What went well: ', 'green', menu.x - 90, menu.y - 60),
        },
        {
          label: 'Pink (To Improve)',
          action: (menu) => this.addStickyCard('To Improve: ', 'pink', menu.x - 90, menu.y - 60),
        },
        {
          label: 'Blue (Action Item)',
          action: (menu) => this.addStickyCard('Action Item: ', 'blue', menu.x - 90, menu.y - 60),
        },
        {
          label: 'Yellow General Note',
          action: (menu) => this.addStickyCard('Note: ', 'yellow', menu.x - 90, menu.y - 60),
        },
      ],
    },
    {
      label: 'Paste Saved Item',
      action: async (menu) => {
        await this.editor.paste(menu.x, menu.y);
      },
      icon: 'paste',
      group: 'clipboard',
      disabled: async () => (await this.editor.getCopiedObjects()).length === 0,
    },
    {
      label: 'Select All Items',
      action: () => {
        this.editor.selectAllObjectsInViewport();
      },
      group: 'clipboard',
    },
  ];

  objectItems: ContextMenuItem[] = [
    {
      label: 'Change Sticky Color',
      group: 'sticky-color',
      visible: (_menu, objects) => {
        return objects.some(obj => obj.id.startsWith('sticky-') && obj instanceof KritzelShape);
      },
      children: [
        {
          label: 'Yellow Theme',
          action: async (_menu, objects) => {
            const shapes = objects.filter(o => o.id.startsWith('sticky-') && o instanceof KritzelShape) as KritzelShape[];
            for (const s of shapes) {
              await this.updateStickyColor(s.id, 'yellow');
            }
            await this.syncCards();
          },
        },
        {
          label: 'Green Theme (What Went Well)',
          action: async (_menu, objects) => {
            const shapes = objects.filter(o => o.id.startsWith('sticky-') && o instanceof KritzelShape) as KritzelShape[];
            for (const s of shapes) {
              await this.updateStickyColor(s.id, 'green');
            }
            await this.syncCards();
          },
        },
        {
          label: 'Pink Theme (To Improve)',
          action: async (_menu, objects) => {
            const shapes = objects.filter(o => o.id.startsWith('sticky-') && o instanceof KritzelShape) as KritzelShape[];
            for (const s of shapes) {
              await this.updateStickyColor(s.id, 'pink');
            }
            await this.syncCards();
          },
        },
        {
          label: 'Blue Theme (Action Item)',
          action: async (_menu, objects) => {
            const shapes = objects.filter(o => o.id.startsWith('sticky-') && o instanceof KritzelShape) as KritzelShape[];
            for (const s of shapes) {
              await this.updateStickyColor(s.id, 'blue');
            }
            await this.syncCards();
          },
        },
      ],
    },
    {
      label: 'Align Selected Cards',
      icon: 'align',
      group: 'layout',
      disabled: (_menu, objects) => objects.length < 2,
      children: [
        {
          label: 'Align Left',
          action: () => this.editor.alignObjects(KritzelAlignment.StartHorizontal),
        },
        {
          label: 'Align Center Horizontally',
          action: () => this.editor.alignObjects(KritzelAlignment.CenterHorizontal),
        },
        {
          label: 'Align Right',
          action: () => this.editor.alignObjects(KritzelAlignment.EndHorizontal),
        },
        {
          label: 'Align Top',
          action: () => this.editor.alignObjects(KritzelAlignment.StartVertical),
        },
        {
          label: 'Align Center Vertically',
          action: () => this.editor.alignObjects(KritzelAlignment.CenterVertical),
        },
        {
          label: 'Align Bottom',
          action: () => this.editor.alignObjects(KritzelAlignment.EndVertical),
        },
      ],
    },
    {
      label: 'Group Selection',
      icon: 'group',
      group: 'layout',
      children: [
        {
          label: 'Group Items',
          disabled: (_menu, objects) => objects.length < 2,
          action: () => this.editor.group(),
        },
        {
          label: 'Ungroup Items',
          disabled: async (_menu, objects) => {
            return !objects.some(o => o.__class__ === 'KritzelGroup');
          },
          action: () => this.editor.ungroup(),
        },
      ],
    },
    {
      label: 'Arrange Layers',
      icon: 'layers',
      group: 'layers',
      children: [
        {
          label: 'Bring to Front',
          action: () => this.editor.bringToFront(),
        },
        {
          label: 'Send to Back',
          action: () => this.editor.sendToBack(),
        },
        {
          label: 'Bring Forward',
          action: () => this.editor.bringForward(),
        },
        {
          label: 'Send Backward',
          action: () => this.editor.sendBackward(),
        },
      ],
    },
    {
      label: 'Delete Selection',
      icon: 'delete',
      group: 'destructive',
      action: async () => {
        await this.editor.delete();
        await this.syncCards();
      },
    },
  ];
}